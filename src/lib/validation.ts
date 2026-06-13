export function validateEmail(email: string): string | null {
  if (!email) return "Email обязателен";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Неверный формат email";
  return null;
}

export function validatePhoneNumber(phoneNumber: string): string | null {
  if (!phoneNumber) return "Телефон обязателен";
  const normalizedPhone = phoneNumber.replace(/[\s\-()]/g, "");
  if (!/^\+?[1-9]\d{9,14}$/.test(normalizedPhone)) return "Неверный формат телефона";
  return null;
}

export function validateEmailOrPhone(identifier: string): string | null {
  if (!identifier) return "Email или телефон обязателен";
  if (identifier.includes("@")) return validateEmail(identifier);
  return validatePhoneNumber(identifier);
}

export function validateNickname(nickname: string): string | null {
  if (!nickname) return "Никнейм обязателен";
  if (nickname.length < 3) return "Минимум 3 символа";
  if (nickname.length > 32) return "Максимум 32 символа";
  if (!/^[a-zA-Z0-9_]+$/.test(nickname)) return "Только латиница, цифры и _";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Пароль обязателен";
  if (password.length < 8) return "Минимум 8 символов";
  if (!/[A-Z]/.test(password)) return "Нужна заглавная буква";
  if (!/[a-z]/.test(password)) return "Нужна строчная буква";
  if (!/[0-9]/.test(password)) return "Нужна цифра";
  if (!/[^A-Za-z0-9]/.test(password)) return "Нужен спецсимвол";
  return null;
}

export function validateName(name: string): string | null {
  if (!name) return "Имя обязательно";
  if (name.length < 2) return "Минимум 2 символа";
  return null;
}

export function validateLotTitle(title: string): string | null {
  if (!title) return "Название обязательно";
  if (title.length < 3) return "Минимум 3 символа";
  if (title.length > 200) return "Максимум 200 символов";
  return null;
}

export function validateLotDescription(description: string): string | null {
  if (!description) return "Описание обязательно";
  if (description.length > 2000) return "Максимум 2000 символов";
  return null;
}

export function validateStartingPrice(price: string): string | null {
  if (!price) return "Цена обязательна";
  const num = parseFloat(price);
  if (isNaN(num) || num <= 0) return "Цена должна быть больше 0";
  return null;
}

export function validateBidAmount(amount: string, currentPrice: number): string | null {
  if (!amount) return "Сумма обязательна";
  const num = parseFloat(amount);
  if (isNaN(num) || num <= currentPrice) return `Ставка должна быть больше ${currentPrice.toLocaleString("ru-RU")}`;
  return null;
}
