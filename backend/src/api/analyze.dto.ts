import { IsIn, IsObject, IsOptional, IsString, MinLength } from 'class-validator';
import { Dialect, PolicyOverride } from '../common/types';

export class AnalyzeDto {
  @IsString()
  @IsIn(['postgresql', 'mysql', 'mariadb', 'sqlite', 'transactsql'])
  dialect!: Dialect;

  @IsString()
  @MinLength(1)
  sql!: string;

  @IsOptional()
  @IsObject()
  policy?: PolicyOverride;
}
