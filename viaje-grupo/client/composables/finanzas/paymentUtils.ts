import type { PaymentList, Payment, SortOptions } from '~/types/finanzas'

// Order function. Used in finanzas pages
export const orderPayments = (items: PaymentList, options?: SortOptions) => {
    const { $dayjs } = useNuxtApp();

    // Sort the array
    items.sort((a: Payment, b: Payment) => {
        // Sort by isCompleted (false first)
        if (a.isPaid !== b.isPaid) {
            return a.isPaid ? 1 : -1;
        }

        // If isCompleted is the same, sort by dueDate
        let firstValue: any = 0;
        let secondValue: any = 0;

        if(options && options.field == "amount") {
            firstValue = a.amount;
            secondValue = b.amount;
        } else if(options && (options.field as string) == "title") {
            firstValue = a.title;
            secondValue = b.title
        }
        else {
            firstValue = $dayjs(a.dueDate, { format: 'MM/DD/YYYY' }).unix();
            secondValue = $dayjs(b.dueDate, { format: 'MM/DD/YYYY' }).unix();
        }

        // Change order if descendant is requested
        if(options && options.type == "desc") {
            const aux = firstValue;
            firstValue = secondValue;
            secondValue = aux;
        }

        return firstValue - secondValue;
    });

    return items
}
