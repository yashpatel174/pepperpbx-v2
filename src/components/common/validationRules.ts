/**
 * Form validation rules shared by every module's Add/Edit form. Each module's own
 * `<feature>.validation.ts` re-exports what it uses, so field-level imports stay module-local.
 */

const NO_EDGE_WHITESPACE_PATTERN = /^[^\s]+(\s+[^\s]+)*$/;
// const CONSECUTIVE_SPACE_PATTERN = /^(?!.*\s{2,}).*$/;

export const noEdgeWhitespaceRule = {
  pattern: NO_EDGE_WHITESPACE_PATTERN,
  message: "Leading and trailing whitespaces are not allowed",
};
