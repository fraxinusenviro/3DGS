export function summarizeSchema(canonical) {
  return {
    propertyCount: canonical.schema.originalPropertyOrder.length,
    properties: canonical.schema.originalPropertyOrder,
    format: canonical.schema.format,
    classification: canonical.classification
  };
}
