'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api-client';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MoreVertical, Eye, ShoppingCart, Search } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ORDER_STATUSES, nextStatuses, statusLabels } from '@/lib/order-status';
import { formatCurrency } from '@/lib/format';
import PageHeader from '@/components/dashboard/page-header';
import OrderStatusBadge from '@/components/order-status-badge';
import { useMyShop } from '@/hooks/use-my-shop';
import RemoteImage from '@/components/remote-image';

interface OrderItem {
  id: string;
  productName: string;
  productImage?: string;
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
  totalAmount: number | string;
  subtotal: number | string;
  status: string;
  items?: OrderItem[];
}


export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: shop } = useMyShop();

  const { data: orders, isLoading, isError, refetch } = useQuery({
    queryKey: ['orders', shop?.id],
    queryFn: async () => {
      const { data } = await api.get(`/orders/shop/${shop!.id}`);
      return data;
    },
    enabled: !!shop?.id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      await api.patch(`/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', shop?.id] });
      toast.success('Order status updated');
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  // Đổi trạng thái đơn; huỷ đơn là thao tác không hoàn tác nên cần xác nhận
  const changeStatus = (order: Order, status: string, onSuccess?: () => void) => {
    if (status === 'CANCELLED' && !confirm(`Cancel order #${order.orderNumber}? This cannot be undone.`)) {
      return;
    }
    updateStatusMutation.mutate({ orderId: order.id, status }, { onSuccess });
  };

  const allOrders: Order[] = orders ?? [];
  const statusCounts = allOrders.reduce<Record<string, number>>((acc, order) => {
    acc[order.status] = (acc[order.status] ?? 0) + 1;
    return acc;
  }, {});

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredOrders = allOrders.filter((order) => {
    if (statusFilter !== 'ALL' && order.status !== statusFilter) return false;
    if (!normalizedSearch) return true;
    return [order.orderNumber, order.buyerName, order.buyerEmail]
      .some((field) => field?.toLowerCase().includes(normalizedSearch));
  });
  const isFiltered = statusFilter !== 'ALL' || !!normalizedSearch;

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Track and manage your customer orders." />

      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        {/* Bộ lọc trạng thái & tìm kiếm */}
        <div className="flex flex-col gap-3 border-b p-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(String(value))} className="min-w-0">
            <TabsList className="max-w-full justify-start overflow-x-auto">
              <TabsTrigger value="ALL" className="flex-none px-2.5">
                All
                <span className="text-xs tabular-nums text-muted-foreground">{allOrders.length}</span>
              </TabsTrigger>
              {ORDER_STATUSES.map((status) => (
                <TabsTrigger key={status} value={status} className="flex-none px-2.5">
                  {statusLabels[status]}
                  <span className="text-xs tabular-nums text-muted-foreground">{statusCounts[status] ?? 0}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="relative w-full lg:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search order, name, email…"
              aria-label="Search orders"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="hidden sm:table-cell pl-4">Order</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="pl-4 sm:pl-2">Customer</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell w-12 pr-4"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="hidden sm:table-cell pl-4"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="pl-4 sm:pl-2"><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="ml-auto h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell className="hidden sm:table-cell pr-4" />
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
            ) : filteredOrders.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ShoppingCart className="h-8 w-8 mb-1" />
                    {isFiltered ? (
                      <>
                        <p className="font-medium text-foreground">No matching orders</p>
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
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-foreground">No orders yet</p>
                        <p className="text-sm">Share your shop link to start getting orders.</p>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id} className="cursor-pointer" onClick={() => setSelectedOrder(order)}>
                  <TableCell className="hidden sm:table-cell pl-4 font-mono text-xs">#{order.orderNumber}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {format(new Date(order.createdAt), 'MMM dd, h:mm a')}
                  </TableCell>
                  <TableCell className="pl-4 sm:pl-2">
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-sm truncate">{order.buyerName}</span>
                      <span className="sm:hidden font-mono text-xs text-muted-foreground">#{order.orderNumber}</span>
                      <span className="hidden sm:block text-xs text-muted-foreground truncate">{order.buyerEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatCurrency(order.totalAmount)}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell pr-4 text-right" onClick={(e) => e.stopPropagation()}>
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
                                Mark as {statusLabels[status].toLowerCase()}
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
                  <p className="text-muted-foreground text-xs uppercase font-semibold tracking-wider mb-1">Customer</p>
                  <p className="font-medium">{selectedOrder.buyerName}</p>
                  <p className="text-muted-foreground">{selectedOrder.buyerEmail}</p>
                  {selectedOrder.buyerPhone && (
                    <p className="text-muted-foreground">{selectedOrder.buyerPhone}</p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase font-semibold tracking-wider mb-1">Shipping Address</p>
                  <p className="font-medium">{selectedOrder.shippingAddress}</p>
                  <p className="text-muted-foreground">{selectedOrder.shippingCity}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase font-semibold tracking-wider mb-1">Date</p>
                  <p>{format(new Date(selectedOrder.createdAt), 'MMM dd, yyyy h:mm a')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase font-semibold tracking-wider mb-1">Status</p>
                  <OrderStatusBadge status={selectedOrder.status} />
                </div>
              </div>

              <Separator />

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-3">Items Ordered</p>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                        {item.productImage && (
                          <RemoteImage src={item.productImage} alt={item.productName} width={40} height={40} className="h-10 w-10 object-cover rounded" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold">{formatCurrency(Number(item.priceAtPurchase) * item.quantity)}</p>
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
                          changeStatus(selectedOrder, status, () =>
                            setSelectedOrder((current) =>
                              current?.id === orderId ? { ...current, status } : current,
                            ),
                          );
                        }}
                        disabled={updateStatusMutation.isPending}
                      >
                        Mark as {statusLabels[status].toLowerCase()}
                      </Button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

