export interface LegalEntityConfig {
  legalName: string;
  brandName: string;
  inn: string;
  ogrn: string;
  legalAddress: string;
  email: string;
  supportEmail: string;
  directorName: string;
}

// Set to empty string to show "draft" status and trigger owner warning as specified in instructions
export const legalEntityConfig: LegalEntityConfig = {
  legalName: "",
  brandName: "NADO ПРАЗДНИК",
  inn: "",
  ogrn: "",
  legalAddress: "",
  email: "",
  supportEmail: "support@nado.io",
  directorName: ""
};

export function setLegalEntityConfigForTesting(newConfig: Partial<LegalEntityConfig>): void {
  Object.assign(legalEntityConfig, newConfig);
}

export function isLegalEntityConfigured(config: LegalEntityConfig = legalEntityConfig): boolean {
  return !!(config.legalName && config.inn && config.ogrn && config.legalAddress && config.directorName);
}
