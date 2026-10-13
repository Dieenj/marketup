import { useEffect, useState } from 'react';

// Giá trị chỉ cập nhật sau khi ngừng thay đổi `delay` ms — vd. ô tìm kiếm gọi API khi người dùng ngừng gõ
export function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
