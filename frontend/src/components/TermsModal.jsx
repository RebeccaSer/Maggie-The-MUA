import React from 'react';

const TermsModal = ({ isOpen, onClose, onAccept }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-4">Terms and Conditions</h2>
                    <div className="space-y-4 text-gray-700">
                        <p><strong>1. Deposit Policy</strong><br/>
                        A 50% deposit is required to confirm your booking. Deposits are non-refundable.</p>
                        
                        <p><strong>2. Cancellation & No-Show</strong><br/>
                        If you cancel within 72 hours of your appointment or fail to show up, your deposit will be forfeited. No refunds will be issued.</p>
                        
                        <p><strong>3. Rescheduling</strong><br/>
                        You may reschedule your appointment up to 72 hours before the scheduled time, subject to availability. Rescheduling must be done via our WhatsApp support line using your booking reference.</p>
                        
                        <p><strong>4. Late Arrivals</strong><br/>
                        If you arrive late, we may need to shorten your service to avoid impacting subsequent appointments. No refunds or discounts will be given for late arrivals.</p>
                        
                        <p><strong>5. Refunds</strong><br/>
                        All sales are final. No refunds will be provided by the service provider.</p>
                        
                        <p><strong>6. Changes by Us</strong><br/>
                        In rare circumstances, we may need to reschedule your appointment. We will notify you as soon as possible and work with you to find a suitable alternative.</p>
                        
                        <p><strong>7. Contact for Changes</strong><br/>
                        All rescheduling and cancellations must be communicated via WhatsApp: <strong>+27 XX XXX XXXX</strong>. Please have your booking reference ready.</p>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Decline</button>
                        <button onClick={onAccept} className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">Accept & Proceed</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsModal;