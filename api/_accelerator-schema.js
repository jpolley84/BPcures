// Label map for the Life Change Accelerator intake.
//
// This used to hand-mirror the question list from the React page, which is a
// silent-failure design: rename a field on the page, forget to mirror it here,
// and that answer disappears from the PDF Joel reads without any error.
//
// It now derives everything from api/_accelerator-questions.js, the single
// source both the form and the PDFs read. Kept as its own module so existing
// imports keep working.

export {
  SECTION_MAP,
  LABELS,
  HEADLINE_FIELDS,
  formatAnswer,
} from './_accelerator-questions.js';
