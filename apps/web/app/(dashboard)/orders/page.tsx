'use client';

import { useCallback, useState } from 'react';
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import api, { getErrorMessage } from '@/lib/api-client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreVertical, Eye, ShoppingCart } from 'lucide-react';
import SearchInput from '@/components/search-input';
import EmptyState from '@/components/empty-state';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  cancelReasonLabels,
  nextStatuses,
  sellerCancelReasons,
  statusLabels,
  type CancelReason,
  type OrderPage,
  type OrderTab,
} from '@/lib/order-status';
import { formatCurrency } from '@/lib/format';
import { dashboardStatsQuery } from '@/lib/dashboard-stats';
import PageHeader from '@/components/dashboard/page-header';
import OrderStatusBadge from '@/components/order-status-badge';
import { useMyShop } from '@/hooks/use-my-shop';
import RemoteImage from '@/components/remote-image';
import CancelOrderDialog, { type CancelOrderInput } from '@/components/cancel-order-dialog';
import OrderStatusTabs from '@/components/order-status-tabs';
import LoadMore from '@/components/load-more';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface OrderItem {
  id: string;
  productName: string;
  productImage?: string;
  variantLabel?: string | null;
  quantity: number;
  priceAtPurchase: number | string;
}

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingDistrict?: string | null;
  shippingNote?: string | null;
  totalAmount: number | string;
  subtotal: number | string;
  status: string;
  cancelledBy?: 'BUYER' | 'SELLER' | null;
  cancelReason?: CancelReason | null;
  cancelNote?: string | null;
  items?: OrderItem[];
}

// Nhãn nút đổi trạng thái; huỷ lúc đang giao = giao không thành công
function actionLabel(order: Order, status: string) {
  if (status !== 'CANCELLED') return `Mark as ${statusLabels[status].toLowerCase()}`;
  return order.status === 'SHIPPING' ? 'Delivery failed' : 'Cancel order';
}

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  // Tìm ở API (đơn được tải từng trang) → chỉ gọi khi ngừng gõ
  const search = useDebouncedValue(searchQuery.trim());
  // Đơn đang chờ chọn lý do huỷ (+ callback cập nhật dialog chi tiết khi thành công)
  const [cancelTarget, setCancelTarget] = useState<{
    order: Order;
    onSuccess?: (order: Order) => void;
  } | null>(null);

  const { data: shop } = useMyShop();

  // Mới nhất trước, 20 đơn mỗi lần; cuộn tới cuối thì tải tiếp (giống Shopee)
  const {
    data,
    isLoading,
    isError,
    refetch,
    isPlaceholderData,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['orders', shop?.id, statusFilter, search],
    queryFn: async ({ pageParam }) =>
      (
        await api.get<OrderPage<Order>>(`/orders/shop/${shop!.id}`, {
          params: {
            status: statusFilter === 'ALL' ? undefined : statusFilter,
            q: search || undefined,
            cursor: pageParam,
          },
        })
      ).data,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!shop?.id,
    // Đổi tab / từ khoá: giữ danh sách cũ (mờ đi) và số đếm trên tab tới khi có kết quả mới
    placeholderData: keepPreviousData,
  });
  const orders = data?.pages.flatMap((page) => page.items) ?? [];
  const counts = data?.pages[0]?.counts;
  const loadMore = useCallback(() => void fetchNextPage(), [fetchNextPage]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
      cancel,
    }: {
      orderId: string;
      status: string;
      cancel?: CancelOrderInput;
    }) =>
      (
        await api.patch<Order>(`/orders/${orderId}/status`, {
          status,
          ...(cancel && { cancelReason: cancel.reason, cancelNote: cancel.note }),
        })
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', shop?.id] });
      queryClient.invalidateQueries({ queryKey: dashboardStatsQuery(shop?.id).queryKey });
      toast.success('Order status updated');
    },
    onError: (error) => {
      // vd. 409: người mua vừa huỷ đơn này
      queryClient.invalidateQueries({ queryKey: ['orders', shop?.id] });
      toast.error(getErrorMessage(error, 'Failed to update status'));
    },
  });

  // Đổi trạng thái đơn; huỷ đơn (không hoàn tác) phải chọn lý do trước
  const changeStatus = (order: Order, status: string, onSuccess?: (order: Order) => void) => {
    if (status === 'CANCELLED') {
      setCancelTarget({ order, onSuccess });
      return;
    }
    updateStatusMutation.mutate({ orderId: order.id, status }, { onSuccess });
  };

  const isFiltered = statusFilter !== 'ALL' || !!search;

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Track and manage your customer orders." />

      <div className="@container rounded-xl border bg-card shadow-xs overflow-hidden">
        {/* Bộ lọc trạng thái & tìm kiếm: chỉ đứng cạnh nhau khi khung đủ chỗ cho cả 7 tab
            (theo độ rộng khung, vì sidebar kéo rộng/hẹp được) */}
        <div className="flex flex-col gap-3 border-b p-3 @5xl:flex-row @5xl:items-center @5xl:justify-between">
          <OrderStatusTabs value={statusFilter} onChange={setStatusFilter} counts={counts} />
          <SearchInput
            label="Search orders"
            placeholder="Search order, name, email, phone…"
            value={searchQuery}
            onChange={setSearchQuery}
            className="w-full @5xl:w-72"
          />
        </div>

        <Table className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="hidden @xl:table-cell pl-4">Order</TableHead>
              <TableHead className="hidden @3xl:table-cell">Date</TableHead>
              <TableHead className="pl-4 @xl:pl-2">Customer</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden @xl:table-cell w-12 pr-4">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Cùng chiều cao với hàng thật: cột khách hàng có 2 dòng (tên + email / mã đơn)
              [...Array(10)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="hidden @xl:table-cell pl-4">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="hidden @3xl:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="pl-4 @xl:pl-2">
                    <div className="flex h-5 items-center">
                      <Skeleton className="h-3.5 w-28" />
                    </div>
                    <div className="flex h-4 items-center">
                      <Skeleton className="h-3 w-36" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="ml-auto h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell className="hidden @xl:table-cell pr-4" />
                </TableRow>
              ))
            ) : isError ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <p className="font-medium text-foreground">Couldn&apos;t load orders</p>
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                      Try again
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="h-48 text-center">
                  <EmptyState
                    icon={ShoppingCart}
                    title={isFiltered ? 'No matching orders' : 'No orders yet'}
                    description={!isFiltered && 'Share your shop link to start getting orders.'}
                    action={
                      isFiltered && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setStatusFilter('ALL');
                            setSearchQuery('');
                          }}
                        >
                          Clear filters
                        </Button>
                      )
                    }
                    className="border-0 bg-transparent py-10"
                  />
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <TableCell className="hidden @xl:table-cell pl-4 font-mono text-xs">
                    #{order.orderNumber}
                  </TableCell>
                  <TableCell className="hidden @3xl:table-cell text-muted-foreground">
                    {format(new Date(order.createdAt), 'MMM dd, h:mm a')}
                  </TableCell>
                  <TableCell className="pl-4 @xl:pl-2">
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-sm truncate">{order.buyerName}</span>
                      <span className="@xl:hidden font-mono text-xs text-muted-foreground">
                        #{order.orderNumber}
                      </span>
                      <span className="hidden @xl:block text-xs text-muted-foreground truncate">
                        {order.buyerEmail}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(order.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell
                    className="hidden @xl:table-cell pr-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label={`Actions for order ${order.orderNumber}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="h-4 w-4" /> View details
                        </DropdownMenuItem>
                        {(nextStatuses[order.status] || []).length > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            {nextStatuses[order.status].map((status) => (
                              <DropdownMenuItem
                                key={status}
                                variant={status === 'CANCELLED' ? 'destructive' : 'default'}
                                className="cursor-pointer"
                                disabled={updateStatusMutation.isPending}
                                onClick={() => changeStatus(order, status)}
                              >
                                {actionLabel(order, status)}
                              </DropdownMenuItem>
                            ))}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {!isPlaceholderData && (
          <LoadMore hasMore={!!hasNextPage} isLoading={isFetchingNextPage} onLoadMore={loadMore} />
        )}
      </div>

      {/* Hộp thoại chi tiết đơn hàng */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-5 pt-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase font-semibold tracking-wider mb-1">
                    Customer
                  </p>
                  <p className="font-medium">{selectedOrder.buyerName}</p>
                  <p className="text-muted-foreground">{selectedOrder.buyerEmail}</p>
                  {selectedOrder.buyerPhone && (
                    <p className="text-muted-foreground">{selectedOrder.buyerPhone}</p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase font-semibold tracking-wider mb-1">
                    Shipping Address
                  </p>
                  <p className="font-medium">{selectedOrder.shippingAddress}</p>
                  <p className="text-muted-foreground">
                    {[selectedOrder.shippingDistrict, selectedOrder.shippingCity]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  {selectedOrder.shippingNote && (
                    <p className="mt-1 italic text-muted-foreground">
                      Note: {selectedOrder.shippingNote}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase font-semibold tracking-wider mb-1">
                    Date
                  </p>
                  <p>{format(new Date(selectedOrder.createdAt), 'MMM dd, yyyy h:mm a')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase font-semibold tracking-wider mb-1">
                    Status
                  </p>
                  <OrderStatusBadge status={selectedOrder.status} />
                </div>
              </div>

              {selectedOrder.status === 'CANCELLED' && selectedOrder.cancelReason && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm">
                  <p className="font-medium">
                    Cancelled by {selectedOrder.cancelledBy === 'BUYER' ? 'the buyer' : 'you'}
                    {' · '}
                    {cancelReasonLabels[selectedOrder.cancelReason]}
                  </p>
                  {selectedOrder.cancelNote && (
                    <p className="mt-0.5 text-muted-foreground">{selectedOrder.cancelNote}</p>
                  )}
                </div>
              )}

              <Separator />

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-3">Items Ordered</p>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                      >
                        {item.productImage && (
                          <RemoteImage
                            src={item.productImage}
                            alt={item.productName}
                            width={40}
                            height={40}
                            className="h-10 w-10 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.variantLabel && `${item.variantLabel} · `}Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-semibold">
                          {formatCurrency(Number(item.priceAtPurchase) * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span className="tabular-nums">{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              {(nextStatuses[selectedOrder.status] || []).length > 0 && (
                <>
                  <Separator />
                  <div className="flex gap-2 flex-wrap">
                    {nextStatuses[selectedOrder.status].map((status) => (
                      <Button
                        key={status}
                        variant={status === 'CANCELLED' ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => {
                          const orderId = selectedOrder.id;
                          // Chỉ cập nhật dialog khi API thành công, tránh hiển thị sai trạng thái nếu lỗi
                          changeStatus(selectedOrder, status, (updated) =>
                            setSelectedOrder((current) =>
                              current?.id === orderId ? { ...current, ...updated } : current,
                            ),
                          );
                        }}
                        disabled={updateStatusMutation.isPending}
                      >
                        {actionLabel(selectedOrder, status)}
                      </Button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {cancelTarget && (
        <CancelOrderDialog
          open
          onOpenChange={(open) => !open && setCancelTarget(null)}
          orderNumber={cancelTarget.order.orderNumber}
          reasons={sellerCancelReasons(cancelTarget.order.status)}
          description={
            cancelTarget.order.status === 'SHIPPING'
              ? "The courier couldn't deliver this order. It will be cancelled and its items returned to stock."
              : 'The buyer will be emailed with your reason, and the items go back into stock. This cannot be undone.'
          }
          isPending={updateStatusMutation.isPending}
          onConfirm={(cancel) =>
            updateStatusMutation.mutate(
              { orderId: cancelTarget.order.id, status: 'CANCELLED', cancel },
              {
                onSuccess: (updated) => {
                  cancelTarget.onSuccess?.(updated);
                  setCancelTarget(null);
                },
              },
            )
          }
        />
      )}
    </div>
  );
}
