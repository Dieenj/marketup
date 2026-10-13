// Tên, địa chỉ, ghi chú… do người mua/người bán nhập → escape trước khi chèn vào HTML email,
// nếu không ai cũng chèn được thẻ HTML/link giả vào email gửi đi từ hệ thống
export function escapeHtml(value: string | null | undefined) {
  return (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
