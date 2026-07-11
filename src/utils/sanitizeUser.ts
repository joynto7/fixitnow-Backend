export const sanitizeUser = <T extends { password: string }>(user: T): Omit<T, 'password'> => {
  const { password: _password, ...safe } = user;
  return safe;
};
