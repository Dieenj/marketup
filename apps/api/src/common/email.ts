// Email luôn lưu và so sánh ở dạng chữ thường, không khoảng trắng → một người = một email
// (đăng nhập seller, email người mua trên đơn, đăng nhập bằng mã của người mua).
export const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;
