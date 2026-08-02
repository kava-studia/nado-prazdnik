export function getStorageNamespace(): string {
  const isDemo = typeof sessionStorage !== 'undefined' && !!sessionStorage.getItem('nado_prazdnik_demo_session');
  return isDemo ? 'nado_prazdnik_demo' : 'nado_prazdnik';
}
