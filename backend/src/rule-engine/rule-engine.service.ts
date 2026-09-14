import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  AnalyzeResult,
  Dialect,
  Finding,
  PolicyOverride,
  RuleDefinition,
} from '../common/types';
import { ParserService } from '../parser/parser.service';
import { applyPolicy, SqlRule } from './rule.types';
import { noDropTableRule } from './rules/no-drop-table';
import { noDropColumnRule } from './rules/no-drop-column';
import { noDeleteWithoutWhereRule } from './rules/no-delete-without-where';
import { noUpdateWithoutWhereRule } from './rules/no-update-without-where';
import { cautionAddNotNullWithoutDefaultRule } from './rules/caution-add-not-null';
import { cautionCreateIndexNonconcurrentPgRule } from './rules/caution-create-index';
import { noTruncateRule } from './rules/no-truncate';
import { dialectUnsupportedSyntaxRule } from './rules/dialect-unsupported';

@Injectable()
export class RuleEngineService implements OnModuleInit {
  private readonly rules = new Map<string, SqlRule>();

  constructor(private readonly parser: ParserService) {}

  onModuleInit() {
    this.register(noDropTableRule);
    this.register(noDropColumnRule);
    this.register(noDeleteWithoutWhereRule);
    this.register(noUpdateWithoutWhereRule);
    this.register(cautionAddNotNullWithoutDefaultRule);
    this.register(cautionCreateIndexNonconcurrentPgRule);
    this.register(noTruncateRule);
    this.register(dialectUnsupportedSyntaxRule);
  }

  register(rule: SqlRule) {
    this.rules.set(rule.ruleId, rule);
  }

  private readonly zhDescriptions: Record<string, string> = {
    no_drop_table: '禁止 DROP TABLE，避免误删整表数据与结构',
    no_drop_column: '禁止 ALTER TABLE ... DROP COLUMN，避免不可逆列删除',
    no_delete_without_where: '禁止无 WHERE 的 DELETE，防止全表删除',
    no_update_without_where: '禁止无 WHERE 的 UPDATE，防止全表更新',
    caution_add_not_null_without_default:
      '警告：新增 NOT NULL 列且无 DEFAULT，可能导致现有行填充失败',
    caution_create_index_nonconcurrent_pg:
      'PostgreSQL 上非 CONCURRENTLY 建索引可能长时间锁表',
    no_truncate: '禁止 TRUNCATE，避免不可回滚的全表清空',
    dialect_unsupported_syntax: '当前方言下无法解析的语法，视为不受支持',
  };

  listRules(): RuleDefinition[] {
    return Array.from(this.rules.values()).map((r) => ({
      ruleId: r.ruleId,
      description: this.zhDescriptions[r.ruleId] || r.description,
      defaultSeverity: r.defaultSeverity,
    }));
  }

  analyze(sql: string, dialect: Dialect, policy?: PolicyOverride): AnalyzeResult {
    const parseResult = this.parser.parse(sql, dialect);
    const sqlSummary = this.parser.summarize(sql);
    let findings: Finding[] = [];

    if (!parseResult.ok) {
      findings = dialectUnsupportedSyntaxRule.check({
        dialect,
        statements: [],
        sql,
        parseError: parseResult.error,
      });
      findings = applyPolicy(findings, policy);
      return {
        ok: false,
        dialect,
        sqlSummary,
        findings,
        parseError: parseResult.error,
      };
    }

    const ctx = {
      dialect,
      statements: parseResult.ast,
      sql,
    };

    for (const rule of this.rules.values()) {
      if (rule.ruleId === 'dialect_unsupported_syntax') continue;
      findings.push(...rule.check(ctx));
    }

    findings = applyPolicy(findings, policy);
    const hasError = findings.some((f) => f.severity === 'error');
    return {
      ok: !hasError,
      dialect,
      sqlSummary,
      findings,
    };
  }
}
