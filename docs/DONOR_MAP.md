# Карта переноса из донорской сборки

## Берём и стабилизируем

- визуальное направление NADO SIGNATURE;
- маршруты клиентского приложения;
- модели событий, заказов и профилей;
- 31 договорный шаблон как `legal_review`;
- immutable contract snapshots;
- `partially_confirmed`;
- `TemplateReviewService` после проверки прав;
- demo-сценарии как отдельные fixtures.

## Переписываем

- `ContractCreateWizard` — слишком большой и хранит несовместимые идентификаторы;
- права записывающих методов `ContractService`;
- `PartyRepository` и выбор стороны;
- изоляцию DemoRepository;
- access control всех договорных страниц;
- consent schema;
- тестовый слой и e2e.

## Не переносим как production-логику

- fake finance и статусы проведённых платежей;
- псевдореальные реквизиты;
- фиктивную юридическую проверку;
- прямой localStorage из страниц;
- старые ключи Evently/KAVA;
- CSS-классы, обходящие дизайн-систему.
