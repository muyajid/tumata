import Joi from "joi";
import { UserRole } from "../user/user.dto";

export interface LoginReq {
    username: string;
    password: string;
}

export interface LoginRes {
    accesToken: string;
    role: UserRole;
}

export const postLoginSchema = Joi.object({
    username: Joi.string().required().messages({
        "string.empty": "Username tidak boleh kosong",
        "any.required": "Username wajib diisi"
    }),
    password: Joi.string().required().messages({
        "string.empty": "Password tidak boleh kosong",
        "any.required": "Password wajib diisi"
    })
});