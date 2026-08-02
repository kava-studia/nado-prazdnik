import { DocumentKind, ContractTemplateVersion, ContractValidationResult } from '../types';
import { evaluateVisibilityCondition } from '../utils/visibility';

export interface WizardStepValidation {
  isValid: boolean;
  errors: string[];
}

export class ContractWizardValidationService {
  static mapStepToKey(step: number, documentKind?: DocumentKind): string {
    if (documentKind === 'platform_policy') {
      const keys = ['template', 'policy_scope', 'policy_terms', 'review'];
      return keys[step - 1] || 'review';
    }
    if (documentKind === 'consent') {
      const keys = ['template', 'consent_subject', 'consent_operator', 'consent_purposes', 'review'];
      return keys[step - 1] || 'review';
    }
    const defaultKeys = ['template', 'binding', 'parties', 'requisites', 'services', 'schedule', 'financials', 'policies', 'attachments', 'review'];
    return defaultKeys[step - 1] || 'review';
  }

  static validateStep(
    step: number | string,
    documentKind: DocumentKind,
    templateId: string,
    formValues: Record<string, string>,
    templateVersion?: ContractTemplateVersion
  ): WizardStepValidation {
    const stepKey = typeof step === 'number' ? this.mapStepToKey(step, documentKind) : step;
    return this.validateStepKey(stepKey, documentKind, templateId, formValues, templateVersion);
  }

  static validateStepKey(
    stepKey: string,
    documentKind: DocumentKind,
    templateId: string,
    formValues: Record<string, string>,
    templateVersion?: ContractTemplateVersion
  ): WizardStepValidation {
    const errors: string[] = [];

    if (documentKind === 'platform_policy') {
      if (stepKey === 'template') {
        if (!templateId) errors.push('Выберите регламентный документ платформы');
      } else if (stepKey === 'policy_scope') {
        if (!formValues['target_audience'] && !formValues['client_name']) {
          errors.push('Укажите целевую аудиторию или область применения регламента');
        }
      }
      return { isValid: errors.length === 0, errors };
    }

    if (documentKind === 'consent') {
      if (stepKey === 'template') {
        if (!templateId) errors.push('Выберите вид согласия');
      } else if (stepKey === 'consent_subject' || stepKey === 'consent_operator' || stepKey === 'consent_purposes') {
        const fio = formValues['consent_subject_fio'] || formValues['data_subject_name'];
        if (!fio || fio.trim() === '') {
          errors.push('Укажите ФИО субъекта персональных данных');
        }
        if (!formValues['data_operator_name'] || formValues['data_operator_name'].trim() === '') {
          errors.push('Укажите наименование оператора персональных данных');
        }
        const purpose = formValues['consent_purpose'] || formValues['processing_purpose'];
        if (!purpose || purpose.trim() === '') {
          errors.push('Укажите цель обработки персональных данных');
        }
        if (!formValues['consent_term'] || formValues['consent_term'].trim() === '') {
          errors.push('Укажите срок действия согласия');
        }
      }
      return { isValid: errors.length === 0, errors };
    }

    // Service, Venue, Organizer contracts
    switch (stepKey) {
      case 'template':
        if (!templateId) errors.push('Выберите вид или шаблон договора');
        break;

      case 'binding':
        break;

      case 'parties': {
        const hasClient = Boolean(formValues['client_id'] || formValues['client_name']);
        const hasExecutor = Boolean(
          formValues['contractor_id'] ||
          formValues['venue_id'] ||
          formValues['organizer_id'] ||
          formValues['contractor_name'] ||
          formValues['venue_name'] ||
          formValues['organizer_name']
        );
        if (!hasClient) {
          errors.push('Выберите или укажите Заказчика');
        }
        if (!hasExecutor) {
          errors.push('Выберите или укажите Исполнителя, Площадку или Организатора');
        }
        break;
      }

      case 'requisites': {
        const clientTax = formValues['client_tax_id'] || formValues['client_inn'] || formValues['client_requisites'];
        const contractorTax = formValues['contractor_tax_id'] || formValues['contractor_inn'] || formValues['contractor_requisites'] || formValues['venue_requisites'] || formValues['organizer_requisites'];
        if (!clientTax || clientTax.trim() === '') {
          errors.push('Укажите реквизиты Заказчика');
        }
        if (!contractorTax || contractorTax.trim() === '') {
          errors.push('Укажите реквизиты Исполнителя / Вторый стороны');
        }
        break;
      }

      case 'services':
        if (!formValues['service_composition'] || formValues['service_composition'].trim() === '') {
          errors.push('Укажите перечень и предмет оказываемых услуг');
        }
        break;

      case 'schedule':
        if (!formValues['event_date'] || formValues['event_date'].trim() === '') {
          errors.push('Укажите дату проведения мероприятия');
        }
        break;

      case 'financials': {
        const priceNum = Number(formValues['price'] || 0);
        if (!formValues['price'] || isNaN(priceNum) || priceNum <= 0) {
          errors.push('Укажите корректную стоимость услуг (больше 0)');
        }
        const prepaymentNum = Number(formValues['prepayment'] || 0);
        if (prepaymentNum > priceNum) {
          errors.push('Сумма аванса не может превышать итоговую стоимость');
        }

        if (templateId === 'tpl-ven-mixed' || templateId.includes('mixed')) {
          const rent = Number(formValues['rent_cost'] || 0);
          const catering = Number(formValues['catering_cost'] || 0);
          const tech = Number(formValues['tech_cost'] || 0);
          if (rent + catering + tech !== priceNum) {
            errors.push(
              `Сумма составляющих смешанного договора (аренда: ${rent}, питание: ${catering}, оборудование: ${tech} = ${rent + catering + tech}) не совпадает с итоговой стоимостью (${priceNum})`
            );
          }
        }
        break;
      }

      case 'policies':
        if (!formValues['cancellation_policy'] || formValues['cancellation_policy'] === 'Условие не определено') {
          errors.push('Выберите порядок и условия отмены договора');
        }
        break;

      case 'attachments':
      case 'review':
        break;
    }

    if (templateVersion && templateVersion.variables) {
      for (const v of templateVersion.variables) {
        const vStepKey = (v as unknown as Record<string, unknown>).stepKey as string | undefined;
        const vStepNum = (v as unknown as Record<string, unknown>).step as number | undefined;
        const matchesKey = vStepKey === stepKey || (vStepNum && this.mapStepToKey(vStepNum, documentKind) === stepKey);

        if ((matchesKey || stepKey === 'template') && v.required) {
          if (!evaluateVisibilityCondition(v.visibilityCondition, formValues)) continue;
          const val = formValues[v.key];
          if (!val || val.trim() === '' || val === 'Условие не определено') {
            const err = `Заполните обязательное поле "${v.label}"`;
            if (!errors.includes(err)) errors.push(err);
          }
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  static validateFullContract(
    formValues: Record<string, string>,
    templateVersion?: ContractTemplateVersion,
    documentKind?: DocumentKind
  ): ContractValidationResult {
    const missingFields: { key: string; label: string; step: number }[] = [];

    let kind: DocumentKind;
    if (documentKind) {
      kind = documentKind;
    } else if (templateVersion?.templateId?.includes('policy')) {
      kind = 'platform_policy';
    } else if (templateVersion?.templateId?.includes('consent')) {
      kind = 'consent';
    } else {
      kind = 'service_contract';
    }

    if (kind === 'platform_policy') {
      if (!formValues['target_audience'] && !formValues['client_name']) {
        missingFields.push({ key: 'target_audience', label: 'Целевая аудитория / область применения', step: 2 });
      }
      if (!formValues['policy_version'] && !formValues['document_version']) {
        missingFields.push({ key: 'policy_version', label: 'Версия регламента', step: 2 });
      }
    } else if (kind === 'consent') {
      const fio = formValues['consent_subject_fio'] || formValues['data_subject_name'];
      if (!fio || fio.trim() === '') {
        missingFields.push({ key: 'consent_subject_fio', label: 'ФИО субъекта персональных данных', step: 2 });
      }
      if (!formValues['consent_subject_passport'] || formValues['consent_subject_passport'].trim() === '') {
        missingFields.push({ key: 'consent_subject_passport', label: 'Паспортные данные / удостоверение', step: 2 });
      }
      if (!formValues['consent_subject_address'] || formValues['consent_subject_address'].trim() === '') {
        missingFields.push({ key: 'consent_subject_address', label: 'Адрес регистрации', step: 2 });
      }
      if (!formValues['data_operator_name'] || formValues['data_operator_name'].trim() === '') {
        missingFields.push({ key: 'data_operator_name', label: 'Наименование оператора персональных данных', step: 3 });
      }
      const purpose = formValues['consent_purpose'] || formValues['processing_purpose'];
      if (!purpose || purpose.trim() === '') {
        missingFields.push({ key: 'consent_purpose', label: 'Цель обработки персональных данных', step: 4 });
      }
      if (!formValues['consent_actions'] || formValues['consent_actions'].trim() === '') {
        missingFields.push({ key: 'consent_actions', label: 'Перечень разрешенных действий', step: 4 });
      }
      if (!formValues['consent_third_parties'] || formValues['consent_third_parties'].trim() === '') {
        missingFields.push({ key: 'consent_third_parties', label: 'Передача третьим лицам', step: 4 });
      }
      if (!formValues['consent_term'] || formValues['consent_term'].trim() === '') {
        missingFields.push({ key: 'consent_term', label: 'Срок действия согласия', step: 4 });
      }
      if (!formValues['consent_withdrawal_procedure'] || formValues['consent_withdrawal_procedure'].trim() === '') {
        missingFields.push({ key: 'consent_withdrawal_procedure', label: 'Порядок отзыва', step: 4 });
      }
      if (!formValues['consent_date'] || formValues['consent_date'].trim() === '') {
        missingFields.push({ key: 'consent_date', label: 'Дата предоставления', step: 4 });
      }
    } else {
      // Event-based service/venue/organizer contract
      if (!formValues['client_name'] || formValues['client_name'].trim() === '') {
        missingFields.push({ key: 'client_name', label: 'ФИО / Наименование Заказчика', step: 3 });
      }
      const executorName = formValues['contractor_name'] || formValues['venue_name'] || formValues['organizer_name'];
      if (!executorName || executorName.trim() === '') {
        missingFields.push({ key: 'contractor_name', label: 'ФИО / Наименование Исполнителя / Вторы стороны', step: 3 });
      }
      if (!formValues['event_date'] || formValues['event_date'].trim() === '') {
        missingFields.push({ key: 'event_date', label: 'Дата проведения мероприятия', step: 6 });
      }
      const priceNum = Number(formValues['price'] || 0);
      if (!formValues['price'] || isNaN(priceNum) || priceNum <= 0) {
        missingFields.push({ key: 'price', label: 'Общая стоимость услуг', step: 7 });
      }
    }

    if (templateVersion && templateVersion.variables) {
      for (const v of templateVersion.variables) {
        if (v.required) {
          if (!evaluateVisibilityCondition(v.visibilityCondition, formValues)) continue;
          const val = formValues[v.key];
          if (!val || val.trim() === '' || val === 'Условие не определено') {
            const exists = missingFields.some(m => m.key === v.key);
            if (!exists) {
              missingFields.push({
                key: v.key,
                label: v.label,
                step: (v as unknown as Record<string, unknown>).step as number || 5
              });
            }
          }
        }
      }
    }

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }
}
