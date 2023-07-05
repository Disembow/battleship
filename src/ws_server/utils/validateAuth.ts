type IValidateAuth = (name: string, password: string) => (string | boolean)[];

export const validateAuth: IValidateAuth = (name, password) => {
  const regex = /^.{5,}$/;

  if (!regex.test(name) && regex.test(password)) {
    return [true, 'Name must have minimum 5 chars length'];
  } else if (regex.test(name) && !regex.test(password)) {
    return [true, 'Password must have minimum 5 chars length'];
  } else if (!regex.test(name) && !regex.test(password)) {
    return [true, 'Name and password must have minimum 5 chars length'];
  } else {
    return [false, ''];
  }
};
