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
import { Badge } from '@/components/ui/badge';
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
import { MoreVertical, Eye, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuthStore } from '@/hooks/use-auth';

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
  paymentStatus: string;
  paymentMethod?: string;
  status: string;
  items?: OrderItem[];
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-indigo-100 text-indigo-800',
  SHIPPING: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const nextStatuses: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPING', 'CANCELLED'],
  SHIPPING: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};


export default function OrdersPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: shop } = useQuery({
    queryKey: ['my-shop'],
    queryFn: async () => {
      const { data } = await api.get('/shops/my-shop');
      return data;
    },
    enabled: !!user,
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', shop?.id],
    queryFn: async () => {
      const { data } = await api.get(`/orders/shop/${shop.id}`);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-2 border-[#111111] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Track and manage your customer orders.</p>
      </div>

      <div className="bg-white border border-border/60 rounded-2xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ShoppingCart className="h-10 w-10 mb-1" />
                    <p className="font-medium">No orders yet</p>
                    <p className="text-sm">Share your shop link to start getting orders.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders?.map((order: Order) => (
                <TableRow key={order.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setSelectedOrder(order)}>
                  <TableCell className="font-mono text-xs">{order.orderNumber}</TableCell>
                  <TableCell>{format(new Date(order.createdAt), 'MMM dd, h:mm a')}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{order.buyerName}</span>
                      <span className="text-xs text-muted-foreground">{order.buyerEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">${Number(order.totalAmount).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        order.paymentStatus === 'PAID'
                          ? 'text-green-600 border-green-200 bg-green-50'
                          : ''
                      }
                    >
                      {order.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[order.status] || ''}>{order.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        {(nextStatuses[order.status] || []).length > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            {nextStatuses[order.status].map((status) => (
                              <DropdownMenuItem
                                key={status}
                                className="text-xs cursor-pointer"
                                onClick={() =>
                                  updateStatusMutation.mutate({ orderId: order.id, status })
                                }
                              >
                                Mark as {status}
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

      {/* Order Detail Dialog */}
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
                  <Badge className={statusColors[selectedOrder.status] || ''}>{selectedOrder.status}</Badge>
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
                          <img src={item.productImage} alt={item.productName} className="h-10 w-10 object-cover rounded" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold">${(Number(item.priceAtPurchase) * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${Number(selectedOrder.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>${Number(selectedOrder.totalAmount).toFixed(2)}</span>
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
                          updateStatusMutation.mutate({ orderId: selectedOrder.id, status });
                          setSelectedOrder({ ...selectedOrder, status });
                        }}
                        disabled={updateStatusMutation.isPending}
                      >
                        Mark as {status}
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

