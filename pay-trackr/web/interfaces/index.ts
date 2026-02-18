// Interfaces, this will potentially go to a specific folder in the future
export interface Payment {
    isPaid: boolean;
    dueDate: string;
    amount: number;
    description: string;
    payment_id: string;
    title: string;
    categoryId: string;
    timePeriod: string;
    id?: string|number;
    isWhatsapp?: boolean;
    status?: 'pending' | 'reviewed';
}
export interface PaymentList extends Array<Payment>{}
export interface TrackerList extends Array<Tracker>{}


export interface General {
    payments: PaymentList;
    tracker: Tracker;
    history: TrackerList;
    fetched: boolean;
    historyFetched: boolean;
}

export interface Tracker {
    payments: PaymentList;
    id?: string;
    user_id: string;
    createdAt: string;
}

export enum SortType {
    Asc = "asc",
    Desc = "desc",
}

export enum SortFields {
    Date = "date",
    Amount = "amount",
}

export interface SortOptions {
    type: SortType, 
    field: SortFields
} 