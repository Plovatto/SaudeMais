export const NO_PREPARATION = 'Sem preparo especial';

export const preparationText = (notes: string | null) => (notes ? `Preparo: ${notes}` : NO_PREPARATION);
