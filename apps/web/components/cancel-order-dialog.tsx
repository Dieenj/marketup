'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { cancelReasonLabels, type CancelReason } from '@/lib/order-status';

export interface CancelOrderInput {
  reason: CancelReason;
  note?: string;
}

interface CancelOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderNumber: string;
  reasons: CancelReason[];
  description: string;
  onConfirm: (input: CancelOrderInput) => void;
  isPending: boolean;
}

const MAX_NOTE = 500;

// Huỷ đơn luôn kèm lý do (người bán ở dashboard, người mua ở trang đơn) — danh sách lý do do nơi gọi truyền vào
export default function CancelOrderDialog({
  open,
  onOpenChange,
  ...props
}: CancelOrderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        {/* Nội dung bị gỡ khi đóng dialog → lần mở sau bắt đầu lại từ đầu */}
        <CancelOrderForm onClose={() => onOpenChange(false)} {...props} />
      </DialogContent>
    </Dialog>
  );
}

function CancelOrderForm({
  orderNumber,
  reasons,
  description,
  onConfirm,
  isPending,
  onClose,
}: Omit<CancelOrderDialogProps, 'open' | 'onOpenChange'> & { onClose: () => void }) {
  // Chỉ một lý do → chọn sẵn (vd. đơn đang giao chỉ có "giao không thành công")
  const [picked, setPicked] = useState<CancelReason | null>(null);
  const [note, setNote] = useState('');
  const reason = picked ?? (reasons.length === 1 ? reasons[0] : null);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Cancel order {orderNumber}?</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <form
        id="cancel-order-form"
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (reason) onConfirm({ reason, note: note.trim() || undefined });
        }}
      >
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">Reason</legend>
          {reasons.map((value) => (
            <label
              key={value}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors hover:bg-muted/50',
                reason === value && 'border-foreground/40 bg-muted/50',
              )}
            >
              <input
                type="radio"
                name="cancel-reason"
                value={value}
                checked={reason === value}
                onChange={() => setPicked(value)}
                className="size-4 accent-current"
              />
              {cancelReasonLabels[value]}
            </label>
          ))}
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="cancel-note">
            Note <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="cancel-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={MAX_NOTE}
            rows={3}
            className="resize-none"
          />
        </div>
      </form>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Keep order
        </Button>
        <Button
          type="submit"
          form="cancel-order-form"
          variant="destructive"
          disabled={!reason || isPending}
        >
          {isPending && <Spinner />}
          Cancel order
        </Button>
      </DialogFooter>
    </>
  );
}
