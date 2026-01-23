import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

/**
 * 用户注册 DTO
 */
export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: '昵称不能为空' })
  @Length(2, 20, { message: '昵称长度必须在2-20个字符之间' })
  @Matches(/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/, {
    message: '昵称只能包含中文、英文、数字和下划线',
  })
  nickname: string;
}
