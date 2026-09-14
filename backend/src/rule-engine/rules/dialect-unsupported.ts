import { makeFinding, RuleContext, SqlRule } from '../rule.types';

export const dialectUnsupportedSyntaxRule: SqlRule = {
  ruleId: 'dialect_unsupported_syntax',
  description: 'Unsupported or unparsable syntax for the selected dialect',
  defaultSeverity: 'error',
  check(ctx: RuleContext) {
    if (!ctx.parseError) return [];
    return [
      makeFinding(
        'dialect_unsupported_syntax',
        'error',
        `Dialect ${ctx.dialect} parse failed: ${ctx.parseError}`,
        0,
        'PARSE_ERROR',
      ),
    ];
  },
};
