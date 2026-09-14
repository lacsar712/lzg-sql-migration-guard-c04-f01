import { Injectable } from '@nestjs/common';
import { Parser } from 'node-sql-parser';
import { Dialect } from '../common/types';

export interface ParseSuccess {
  ok: true;
  ast: any[];
  dialect: Dialect;
}

export interface ParseFailure {
  ok: false;
  error: string;
  dialect: Dialect;
}

export type ParseResult = ParseSuccess | ParseFailure;

const DIALECT_MAP: Record<Dialect, string> = {
  postgresql: 'PostgreSQL',
  mysql: 'MySQL',
  mariadb: 'MariaDB',
  sqlite: 'SQLite',
  transactsql: 'TransactSQL',
};

@Injectable()
export class ParserService {
  private readonly parser = new Parser();

  parse(sql: string, dialect: Dialect): ParseResult {
    try {
      const database = DIALECT_MAP[dialect] || 'PostgreSQL';
      // node-sql-parser 对 CONCURRENTLY 支持不完整：去掉关键字再解析，并打标
      const concurrent =
        dialect === 'postgresql' &&
        /CREATE\s+(UNIQUE\s+)?INDEX\s+CONCURRENTLY/i.test(sql);
      const normalized = concurrent
        ? sql.replace(
            /CREATE\s+(UNIQUE\s+)?INDEX\s+CONCURRENTLY/gi,
            (_m, unique) =>
              `CREATE ${unique || ''}INDEX /*concurrent*/`,
          )
        : sql;
      const ast = this.parser.astify(normalized, { database });
      const statements = (Array.isArray(ast) ? ast : [ast]).map((stmt: any) => {
        if (concurrent && stmt) {
          return { ...stmt, concurrently: true };
        }
        return stmt;
      });
      return { ok: true, ast: statements, dialect };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: message, dialect };
    }
  }

  summarize(sql: string, maxLen = 120): string {
    const oneLine = sql.replace(/\s+/g, ' ').trim();
    if (oneLine.length <= maxLen) return oneLine;
    return `${oneLine.slice(0, maxLen)}...`;
  }
}
