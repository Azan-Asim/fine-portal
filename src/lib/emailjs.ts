import emailjs from '@emailjs/browser';

emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY as string);

export interface PenaltyEmailData {
    employeeName: string;
    employeeEmail: string;
    reason: string;
    amount: number;
    date: string;
}

export async function sendPenaltyEmail(data: PenaltyEmailData): Promise<void> {
    await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID as string,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID as string,
        {
            to_name: data.employeeName,
            to_email: data.employeeEmail,
            reason: data.reason,
            amount: `PKR ${data.amount.toLocaleString()}`,
            penalty_date: data.date,
            bank_name: 'Azan Asim',
            bank_service: 'JazzCash',
            bank_account: '03221475219',
        },
    );
}
