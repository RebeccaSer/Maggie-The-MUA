const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Send booking confirmation (customer + provider)
const sendBookingConfirmationEmail = async (customerInfo, appointmentId, bookingDetails) => {
    const { name, email, phone, notes } = customerInfo;
    const { appointmentDate, services, package: pkg, totalPrice, depositAmount, location, fullAddress, bookingReference } = bookingDetails;

    let serviceList = '';
    if (services && services.length > 0) {
        serviceList = services.map(s => `${s.name} x${s.quantity}`).join(', ');
    } else if (pkg && pkg.name) {
        serviceList = `Package: ${pkg.name}`;
    } else {
        serviceList = 'N/A';
    }

    const locationText = location === 'studio' ? 'Studio' : fullAddress || location;

    const buildHtml = (recipientName, isProvider = false) => `
        <h2>Booking Confirmation - HER BY MAGGIE</h2>
        <p>Dear ${recipientName},</p>
        <p>${isProvider ? 'A new appointment has been booked. Details below:' : 'Your appointment has been successfully booked. Please find details below:'}</p>
        <p><strong>Booking Reference:</strong> ${bookingReference || appointmentId}</p>
        ${isProvider ? `
        <p><strong>Customer Name:</strong> ${name}</p>
        <p><strong>Customer Email:</strong> ${email}</p>
        <p><strong>Customer Phone:</strong> ${phone}</p>
        ` : ''}
        <p><strong>Date & Time:</strong> ${new Date(appointmentDate).toLocaleString()}</p>
        <p><strong>Services:</strong> ${serviceList}</p>
        <p><strong>Total Amount:</strong> R${totalPrice.toFixed(2)}</p>
        <p><strong>Deposit Paid:</strong> R${depositAmount.toFixed(2)}</p>
        <p><strong>Location:</strong> ${locationText}</p>
        ${notes ? `<p><strong>Customer Notes:</strong> ${notes}</p>` : ''}
        <hr/>
        <h3>Important Policies</h3>
        <ul>
            <li>Deposits are non-refundable.</li>
            <li>No-shows or cancellations within 72 hours of appointment result in forfeiture of deposit.</li>
            <li>Rescheduling allowed up to 72 hours prior, subject to availability. Contact our WhatsApp support line with your booking reference.</li>
            <li>No refunds from service provider.</li>
        </ul>
        <p>For any changes, please contact us on WhatsApp: <strong>+27 84 030 4658</strong> (use your booking reference).</p>
        <p>Thank you for choosing HER BY MAGGIE!</p>
    `;

    // Send to customer
    await transporter.sendMail({
        from: `"HER BY MAGGIE" <${process.env.SMTP_FROM}>`,
        to: email,
        subject: `Booking Confirmation - ${bookingReference || appointmentId}`,
        html: buildHtml(name, false),
    });

    // Send to provider
    if (process.env.PROVIDER_EMAIL) {
        await transporter.sendMail({
            from: `"HER BY MAGGIE" <${process.env.SMTP_FROM}>`,
            to: process.env.PROVIDER_EMAIL,
            subject: `New Booking - ${bookingReference || appointmentId} - ${name}`,
            html: buildHtml('Service Provider', true),
        });
    }
};

// Send appointment update (reschedule) notification to both customer and provider
const sendAppointmentUpdateEmail = async (customerInfo, appointmentId, oldDateTime, newDateTime, reason, bookingReference) => {
    const { name, email } = customerInfo;
    const htmlCustomer = `
        <h2>Appointment Rescheduled - HER BY MAGGIE</h2>
        <p>Dear ${name},</p>
        <p>Your appointment has been rescheduled by the service provider.</p>
        <p><strong>Booking Reference:</strong> ${bookingReference || appointmentId}</p>
        <p><strong>Old Date & Time:</strong> ${new Date(oldDateTime).toLocaleString()}</p>
        <p><strong>New Date & Time:</strong> ${new Date(newDateTime).toLocaleString()}</p>
        ${reason ? `<p><strong>Reason for change:</strong> ${reason}</p>` : ''}
        <p>If this new time does not work for you, please contact us on WhatsApp: <strong>+27 84 030 4658</strong> with your booking reference.</p>
        <p>Thank you for understanding.</p>
    `;

    const htmlProvider = `
        <h2>Appointment Rescheduled - HER BY MAGGIE</h2>
        <p>Dear Service Provider,</p>
        <p>An appointment has been rescheduled.</p>
        <p><strong>Booking Reference:</strong> ${bookingReference || appointmentId}</p>
        <p><strong>Customer Name:</strong> ${name}</p>
        <p><strong>Old Date & Time:</strong> ${new Date(oldDateTime).toLocaleString()}</p>
        <p><strong>New Date & Time:</strong> ${new Date(newDateTime).toLocaleString()}</p>
        ${reason ? `<p><strong>Reason for change:</strong> ${reason}</p>` : ''}
    `;

    // Send to customer
    await transporter.sendMail({
        from: `"HER BY MAGGIE" <${process.env.SMTP_FROM}>`,
        to: email,
        subject: `Appointment Rescheduled - ${bookingReference || appointmentId}`,
        html: htmlCustomer,
    });

    // Send to provider
    if (process.env.PROVIDER_EMAIL) {
        await transporter.sendMail({
            from: `"HER BY MAGGIE" <${process.env.SMTP_FROM}>`,
            to: process.env.PROVIDER_EMAIL,
            subject: `Appointment Rescheduled - ${bookingReference || appointmentId} - ${name}`,
            html: htmlProvider,
        });
    }
};

// Send appointment cancellation notification to both customer and provider
const sendAppointmentCancellationEmail = async (customerInfo, appointmentId, reason, bookingReference) => {
    const { name, email } = customerInfo;
    const htmlCustomer = `
        <h2>Appointment Cancelled - HER BY MAGGIE</h2>
        <p>Dear ${name},</p>
        <p>Your appointment has been cancelled by the service provider.</p>
        <p><strong>Booking Reference:</strong> ${bookingReference || appointmentId}</p>
        ${reason ? `<p><strong>Reason for cancellation:</strong> ${reason}</p>` : ''}
        <p>If you have any questions, please contact us on WhatsApp: <strong>+27 84 030 4658</strong>.</p>
        <p>We hope to serve you in the future.</p>
    `;

    const htmlProvider = `
        <h2>Appointment Cancelled - HER BY MAGGIE</h2>
        <p>Dear Service Provider,</p>
        <p>An appointment has been cancelled.</p>
        <p><strong>Booking Reference:</strong> ${bookingReference || appointmentId}</p>
        <p><strong>Customer Name:</strong> ${name}</p>
        ${reason ? `<p><strong>Reason for cancellation:</strong> ${reason}</p>` : ''}
    `;

    // Send to customer
    await transporter.sendMail({
        from: `"HER BY MAGGIE" <${process.env.SMTP_FROM}>`,
        to: email,
        subject: `Appointment Cancelled - ${bookingReference || appointmentId}`,
        html: htmlCustomer,
    });

    // Send to provider
    if (process.env.PROVIDER_EMAIL) {
        await transporter.sendMail({
            from: `"HER BY MAGGIE" <${process.env.SMTP_FROM}>`,
            to: process.env.PROVIDER_EMAIL,
            subject: `Appointment Cancelled - ${bookingReference || appointmentId} - ${name}`,
            html: htmlProvider,
        });
    }
};

module.exports = {
    sendBookingConfirmationEmail,
    sendAppointmentUpdateEmail,
    sendAppointmentCancellationEmail,
};