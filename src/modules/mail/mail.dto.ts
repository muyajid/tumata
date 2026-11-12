export interface SendMailDto {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendCredentialDto {
  to: string;
  username: string;
  password: string;
}
