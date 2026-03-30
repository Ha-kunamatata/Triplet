/**
 * 숫자를 통화 형식으로 변환
 * ex) 15000 → "15,000원"
 */
export function formatCurrency(amount: number, currency = 'KRW'): string {
  if (currency === 'KRW') {
    return `${amount.toLocaleString('ko-KR')}원`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * 큰 숫자 축약
 * ex) 1500 → "1.5K", 1500000 → "1.5M"
 */
export function formatCompactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/**
 * 별점 표시용 소수점 1자리
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/**
 * 전화번호 하이픈 포맷
 * ex) "01012345678" → "010-1234-5678"
 */
export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/**
 * 글자 수 제한 및 말줄임
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}
