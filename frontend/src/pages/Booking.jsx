import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { servicesAPI, appointmentsAPI } from '../utils/api';

const Booking = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [allAddons, setAllAddons] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const studioLocation = {
    address: "27 Swallow Street Rainbow Park, Polokwane, 0699",
    coordinates: { lat: -23.9318, lng: 29.4795 }
  };

  // Form state
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [location, setLocation] = useState('studio');
  const [customerLocation, setCustomerLocation] = useState({
    address: '',
    suburb: '',
    city: '',
    postalCode: '',
    distance: 0,
    coordinates: null
  });
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [lateBookingFee, setLateBookingFee] = useState(0);
  const [showEarlyBookingConfirm, setShowEarlyBookingConfirm] = useState(false);
  const [pendingDate, setPendingDate] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Debounce timer ref
  const debounceTimer = useRef(null);

  // Helper functions
  const getPackageStartTime = (pkg) => {
    if (!pkg) return null;
    if (pkg.name === 'All-in-one Package') return '03:00';
    return '04:00';
  };

  const getDaysDifference = (date) => {
    const today = new Date(); today.setHours(0,0,0,0);
    const bookingDate = new Date(date); bookingDate.setHours(0,0,0,0);
    const diffTime = bookingDate - today;
    return Math.ceil(diffTime / (1000*60*60*24));
  };

  const isEarlyBooking = (date) => {
    if (!selectedPackage) return false;
    return getDaysDifference(date) < 14;
  };

  const calculateLateBookingFee = (bookingDate) => {
    if (!selectedPackage) return 0;
    const daysDiff = getDaysDifference(bookingDate);
    if (daysDiff < 14) return (14 - daysDiff) * 300;
    return 0;
  };

  const geocodeAddress = async (address) => {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`);
    const data = await response.json();
    if (data.length === 0) throw new Error('Address not found');
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  };

  const reverseGeocode = async (lat, lng) => {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
    const data = await response.json();
    return data.display_name || `${lat}, ${lng}`;
  };

  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) reject(new Error('Geolocation not supported'));
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (error) => reject(error)
      );
    });
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 10) / 10;
  };

  const checkFullDayAvailability = async (date) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://maggie-the-mua.onrender.com//api'}/availability/check/${date}`);
      const data = await response.json();
      return data.isAvailable;
    } catch (error) {
      console.error('Full-day availability error:', error);
      return true;
    }
  };

  const checkTimeSlotAvailability = async (date, time) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://maggie-the-mua.onrender.com//api'}/availability/check/${date}/${time}`);
      const data = await response.json();
      return data.isAvailable;
    } catch (error) {
      console.error('Time slot availability error:', error);
      return true;
    }
  };

  const handleDateSelect = async (date) => {
    const isDateAvailable = await checkFullDayAvailability(date);
    if (!isDateAvailable) {
      alert('The artist is not available on this date. Please select another date.');
      return;
    }
    if (selectedPackage && getDaysDifference(date) < 14) {
      const fee = calculateLateBookingFee(date);
      setPendingDate(date);
      setLateBookingFee(fee);
      setShowEarlyBookingConfirm(true);
    } else {
      setSelectedDate(date);
      if (selectedPackage) setLateBookingFee(calculateLateBookingFee(date));
    }
  };

  const handleTimeChange = async (time) => {
    if (!selectedDate) {
      alert('Please select a date first.');
      return;
    }
    const isTimeAvailable = await checkTimeSlotAvailability(selectedDate, time);
    if (!isTimeAvailable) {
      alert('This time slot is not available. Please choose another time.');
      return;
    }
    setSelectedTime(time);
  };

  const confirmEarlyBooking = () => {
    setSelectedDate(pendingDate);
    setShowEarlyBookingConfirm(false);
    setPendingDate(null);
  };

  const cancelEarlyBooking = () => {
    setShowEarlyBookingConfirm(false);
    setPendingDate(null);
    setLateBookingFee(0);
  };

  // Load services
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [servicesRes, addonsRes, packagesRes] = await Promise.all([
          servicesAPI.getServices(),
          servicesAPI.getAddons(),
          servicesAPI.getPackages()
        ]);
        setServices(servicesRes.data.data || []);
        setAllAddons(addonsRes.data.data || []);
        setPackages(packagesRes.data.data || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load services. Please refresh the page or check your connection.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleAddressSearch = async (address) => {
    if (!address || address.length < 5) return;
    setCalculatingDistance(true);
    try {
      const coords = await geocodeAddress(address);
      const dist = calculateDistance(
        studioLocation.coordinates.lat, studioLocation.coordinates.lng,
        coords.lat, coords.lng
      );
      setCustomerLocation({
        address: address,
        coordinates: coords,
        distance: dist,
        suburb: '',
        city: ''
      });
    } catch (err) {
      console.error(err);
      alert('Could not find address. Please try a landmark or use current location.');
    } finally {
      setCalculatingDistance(false);
    }
  };

  const debouncedAddressSearch = (address) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      handleAddressSearch(address);
    }, 800);
  };

  const handleUseCurrentLocation = async () => {
    setCalculatingDistance(true);
    try {
      const coords = await getUserLocation();
      const dist = calculateDistance(
        studioLocation.coordinates.lat, studioLocation.coordinates.lng,
        coords.lat, coords.lng
      );
      const address = await reverseGeocode(coords.lat, coords.lng);
      setCustomerLocation({
        address: address,
        coordinates: coords,
        distance: dist,
        suburb: '',
        city: ''
      });
    } catch (err) {
      alert('Unable to get your location. Please enter address manually.');
    } finally {
      setCalculatingDistance(false);
    }
  };

  // Cart actions
  const addToCart = (service) => {
    if (selectedPackage) {
      alert('Cannot add individual services when a package is selected.');
      return;
    }
    setCartItems(prev => {
      const existing = prev.find(i => i.service.id === service.id);
      if (existing) return prev.map(i => i.service.id === service.id ? { ...i, quantity: i.quantity+1 } : i);
      return [...prev, { service, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => setCartItems(prev => prev.filter(i => i.service.id !== id));
  const updateQuantity = (id, delta) => {
    setCartItems(prev => prev.map(i => {
      if (i.service.id === id) {
        const newQty = i.quantity + delta;
        return newQty < 1 ? null : { ...i, quantity: newQty };
      }
      return i;
    }).filter(Boolean));
  };

  const selectPackage = (pkg) => {
    if (cartItems.length > 0 && !window.confirm('Selecting a package will clear your cart. Continue?')) return;
    setCartItems([]);
    setSelectedPackage(pkg);
    setLocation('mobile');
    setSelectedTime(getPackageStartTime(pkg));
  };

  const clearPackage = () => {
    if (window.confirm('Clear package selection?')) {
      setSelectedPackage(null);
      setLocation('studio');
      setSelectedTime('');
      setSelectedDate('');
      setLateBookingFee(0);
    }
  };

  const handleAddonToggle = (addon) => {
    const exists = selectedAddons.find(a => a.addon.id === addon.id);
    if (exists) setSelectedAddons(prev => prev.filter(a => a.addon.id !== addon.id));
    else setSelectedAddons([...selectedAddons, { addon, quantity: 1 }]);
  };

  const handleAddonQuantityChange = (addonId, delta) => {
    setSelectedAddons(prev => prev.map(a => {
      if (a.addon.id === addonId) {
        const newQty = a.quantity + delta;
        return newQty < 1 ? null : { ...a, quantity: newQty };
      }
      return a;
    }).filter(Boolean));
  };

  const calculateTotals = () => {
    let serviceTotal = 0, serviceDur = 0;
    cartItems.forEach(item => {
      serviceTotal += parseFloat(item.service.base_price) * item.quantity;
      serviceDur += item.service.duration_minutes * item.quantity;
    });
    let packageTotal = 0, packageDur = 0;
    if (selectedPackage) {
      packageTotal = parseFloat(selectedPackage.base_price);
      packageDur = selectedPackage.base_duration_minutes;
    }
    let addonTotal = 0, addonDur = 0;
    selectedAddons.forEach(a => {
      addonTotal += parseFloat(a.addon.price) * a.quantity;
      addonDur += a.addon.duration_minutes * a.quantity;
    });
    const subtotal = serviceTotal + packageTotal + addonTotal;
    const totalDuration = serviceDur + packageDur + addonDur;
    let transportFee = 0;
    if (location === 'mobile' && customerLocation.distance > 0) {
      transportFee = 1000 + (customerLocation.distance * 11.5);
    }
    const finalTotal = subtotal + transportFee + lateBookingFee;
    return { subtotal, transportFee, lateBookingFee, finalTotal, totalDuration };
  };

  const { subtotal, transportFee, finalTotal, totalDuration } = calculateTotals();

  const displayedAddons = allAddons.filter(addon =>
    addon.service_id === null || cartItems.some(item => item.service.id === addon.service_id)
  );

  const availableDates = (() => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 366; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  })();

  const timeSlots = Array.from({ length: 10 }, (_, i) => `${(8+i).toString().padStart(2,'0')}:00`);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0 && !selectedPackage) {
      alert('Please select at least one service or a package');
      return;
    }
    if (!selectedDate || !selectedTime) {
      alert('Please select date and time');
      return;
    }
    if (!termsAccepted) {
      setShowTermsModal(true);
      return;
    }
    if (selectedPackage && isEarlyBooking(selectedDate)) {
      const days = getDaysDifference(selectedDate);
      if (!window.confirm(`This booking is ${days} days away. Late fee R${lateBookingFee} will apply. Proceed?`)) return;
    }
    if (location === 'mobile' && !customerLocation.address && !customerLocation.coordinates) {
      alert('Please provide an address or use current location for mobile service');
      return;
    }

    const bookingPayload = {
      services: cartItems.map(i => ({ id: i.service.id, quantity: i.quantity })),
      package: selectedPackage ? { id: selectedPackage.id, quantity: 1 } : null,
      addons: selectedAddons.map(a => ({ id: a.addon.id, quantity: a.quantity })),
      appointmentDate: `${selectedDate}T${selectedTime}:00`,
      location: location === 'studio' ? 'studio' : (customerLocation.address || 'Mobile service'),
      coordinates: customerLocation.coordinates,
      customerInfo: { name: customerInfo.name, email: customerInfo.email, phone: customerInfo.phone, notes: customerInfo.notes },
      termsAccepted: true
    };

    setSubmitting(true);
    try {
      const response = await appointmentsAPI.create(bookingPayload);
      if (response.data.success) {
        const paymentData = {
          services: cartItems.map(i => ({ ...i.service, quantity: i.quantity })),
          package: selectedPackage ? { ...selectedPackage, quantity: 1 } : null,
          addons: selectedAddons.map(a => ({ ...a.addon, quantity: a.quantity })),
          appointmentDate: `${selectedDate}T${selectedTime}`,
          location: location === 'studio' ? 'studio' : (customerLocation.address || 'Mobile service'),
          coordinates: customerLocation.coordinates,
          customerInfo,
          studioLocation,
          transportFee,
          lateBookingFee,
          totalPrice: finalTotal,
          depositAmount: finalTotal * 0.5,
          appointmentId: response.data.data.appointment.id
        };
        navigate('/payment', { state: { bookingData: paymentData } });
      } else throw new Error(response.data.error || 'Booking failed');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || err.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Modals
  const TermsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl max-h-[80vh] overflow-y-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Terms and Conditions</h2>
        <div className="space-y-4 text-gray-700">
          <p><strong>1. Deposit Policy</strong><br/>50% deposit required, non‑refundable.</p>
          <p><strong>2. Cancellation & No-Show</strong><br/>Cancel within 72h or no‑show forfeits deposit. No refunds.</p>
          <p><strong>3. Rescheduling</strong><br/>Allowed up to 72h before appointment, subject to availability. Contact WhatsApp with booking reference.</p>
          <p><strong>4. Late Arrivals</strong><br/>May shorten service; no refund/discount.</p>
          <p><strong>5. Refunds</strong><br/>All sales final.</p>
          <p><strong>6. Changes by Us</strong><br/>We may reschedule in rare cases, will notify you.</p>
          <p><strong>7. Contact for Changes</strong><br/>WhatsApp: <strong>+27 84 030 4658</strong> with booking reference.</p>
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <button onClick={() => setShowTermsModal(false)} className="bg-gray-300 px-4 py-2 rounded">Decline</button>
          <button onClick={() => { setTermsAccepted(true); setShowTermsModal(false); }} className="bg-yellow-600 text-white px-4 py-2 rounded">Accept & Proceed</button>
        </div>
      </div>
    </div>
  );

  const EarlyBookingModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md">
        <h3 className="text-lg font-semibold mb-4">Early Booking Confirmation</h3>
        <p className="mb-4">This date is less than 14 days away. Late fee of <strong className="text-red-600">R{lateBookingFee}</strong> will apply. Proceed?</p>
        <div className="flex space-x-3">
          <button onClick={confirmEarlyBooking} className="bg-yellow-600 text-white px-4 py-2 rounded">Yes, Proceed</button>
          <button onClick={cancelEarlyBooking} className="bg-gray-600 text-white px-4 py-2 rounded">Cancel</button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-yellow-600">Loading services...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center px-4">
        <div className="text-center bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md">
          <p className="font-bold mb-2">Error loading services</p>
          <p className="text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen px-4 py-12">
      {showTermsModal && <TermsModal />}
      {showEarlyBookingConfirm && <EarlyBookingModal />}

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Book Your Appointment</h1>
          <p className="text-xl text-white">Schedule your makeup or hair service with HER BY MAGGIE</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          {[1,2,3,4].map(stepNumber => (
            <div key={stepNumber} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= stepNumber ? 'bg-yellow-500 text-white' : 'bg-white text-black'
              }`}>{stepNumber}</div>
              {stepNumber < 4 && <div className={`w-16 h-1 ${step > stepNumber ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>}
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-2 text-sm text-white">
          <span className="w-24 text-center">Services</span>
          <span className="w-24 text-center">Add-ons</span>
          <span className="w-24 text-center">Date & Time</span>
          <span className="w-24 text-center">Details</span>
        </div>

        <form onSubmit={handleSubmit} className="bg-black rounded-lg shadow-md p-6">
          {/* Step 1: Service Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Select Services</h2>

              {/* Packages */}
              {packages.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Bridal Packages</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {packages.map(pkg => {
                      const fixedTime = getPackageStartTime(pkg);
                      return (
                        <div
                          key={pkg.id}
                          className={`bg-yellow-100 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            selectedPackage?.id === pkg.id ? 'border-yellow-600 bg-yellow-50' : 'border-yellow-200 hover:border-yellow-300'
                          }`}
                          onClick={() => selectPackage(pkg)}
                        >
                          <h4 className="font-semibold text-black">{pkg.name}</h4>
                          <p className="text-black text-sm mt-1">{pkg.description}</p>
                          <div className="flex justify-between mt-2">
                            <span className="text-lg font-bold text-yellow-900">R{parseFloat(pkg.base_price).toFixed(2)}</span>
                            <span className="text-gray-500">{Math.floor(pkg.base_duration_minutes/60)}h {pkg.base_duration_minutes%60}m</span>
                          </div>
                          <div className="mt-2 text-sm text-yellow-700">⏰ Fixed Start Time: {fixedTime}:00</div>
                          {selectedPackage?.id === pkg.id && (
                            <button type="button" onClick={(e) => { e.stopPropagation(); clearPackage(); }} className="mt-3 w-full bg-red-600 text-white py-1 rounded text-sm hover:bg-red-700">
                              Remove Package
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {selectedPackage && (
                    <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mt-2">
                      <p className="text-yellow-800 text-sm">
                        ✓ Package selected: <strong>{selectedPackage.name}</strong>
                        <span className="block text-xs mt-1">Start time: <strong>{getPackageStartTime(selectedPackage)}:00</strong> (fixed)</span>
                        <span className="block text-xs mt-1">Packages are housecall only and require 14 days advance booking (late fee applies for earlier dates)</span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Individual Services */}
              {!selectedPackage && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Individual Services</h3>
                  {services.length === 0 ? (
                    <p className="text-white text-center py-8">No services available. Please check back later.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {services.map(service => (
                        <div key={service.id} className="bg-yellow-100 border-2 border-gray-200 rounded-lg p-4">
                          <h4 className="font-semibold text-black">{service.name}</h4>
                          <p className="text-black text-sm mt-1">{service.description}</p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-lg font-bold text-yellow-900">R{parseFloat(service.base_price).toFixed(2)}</span>
                            <span className="text-gray-500">{service.duration_minutes}m</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => addToCart(service)}
                            className="mt-3 w-full bg-yellow-600 text-white py-2 rounded hover:bg-yellow-700"
                          >
                            Add to Cart
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Cart Summary */}
              {!selectedPackage && cartItems.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Your Cart</h3>
                  {cartItems.map(item => (
                    <div key={item.service.id} className="flex justify-between items-center mb-2">
                      <div>
                        <span>{item.service.name}</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <button type="button" onClick={() => updateQuantity(item.service.id, -1)} className="px-2 py-1 bg-gray-200 rounded">-</button>
                          <span>{item.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(item.service.id, 1)} className="px-2 py-1 bg-gray-200 rounded">+</button>
                          <button type="button" onClick={() => removeFromCart(item.service.id)} className="ml-2 text-red-600 text-sm">Remove</button>
                        </div>
                      </div>
                      <span>R{(parseFloat(item.service.base_price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 font-semibold">
                    Subtotal: R{subtotal.toFixed(2)}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={cartItems.length === 0 && !selectedPackage}
                className="w-full bg-yellow-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-yellow-700 disabled:bg-gray-400"
              >
                Continue to Add-ons
              </button>
            </div>
          )}

          {/* Step 2: Add-ons */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Select Add-ons</h2>
              {displayedAddons.length === 0 ? (
                <p className="text-white">No add-ons available for your selection.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayedAddons.map(addon => {
                    const selected = selectedAddons.find(a => a.addon.id === addon.id);
                    return (
                      <div
                        key={addon.id}
                        className={`bg-yellow-100 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          selected ? 'border-yellow-600 bg-yellow-50' : 'border-gray-200 hover:border-yellow-300'
                        }`}
                        onClick={() => handleAddonToggle(addon)}
                      >
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-semibold text-black">{addon.name}</h4>
                            <p className="text-black text-sm">{addon.description}</p>
                          </div>
                          <span className="font-bold text-yellow-900">R{parseFloat(addon.price).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-gray-500">{addon.duration_minutes}m</span>
                          {selected && (
                            <div className="flex items-center space-x-2">
                              <button type="button" onClick={(e) => { e.stopPropagation(); handleAddonQuantityChange(addon.id, -1); }} className="w-6 h-6 bg-gray-200 rounded-full">-</button>
                              <span>{selected.quantity}</span>
                              <button type="button" onClick={(e) => { e.stopPropagation(); handleAddonQuantityChange(addon.id, 1); }} className="w-6 h-6 bg-gray-300 rounded-full">+</button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex space-x-4">
                <button type="button" onClick={() => setStep(1)} className="flex-1 bg-gray-600 text-white py-3 rounded-lg">Back</button>
                <button type="button" onClick={() => setStep(3)} className="flex-1 bg-yellow-600 text-white py-3 rounded-lg">Continue</button>
              </div>
            </div>
          )}

          {/* Step 3: Date, Time, Location */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Select Date, Time & Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date Picker */}
                <div>
                  <label className="block text-white mb-2">Select Date</label>
                  <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto p-2 border border-gray-300 rounded-md bg-white">
                    {availableDates.map(date => {
                      const isEarly = selectedPackage && getDaysDifference(date) < 14;
                      const daysDiff = selectedPackage ? getDaysDifference(date) : 0;
                      return (
                        <button
                          key={date}
                          type="button"
                          onClick={() => handleDateSelect(date)}
                          className={`p-2 rounded text-sm transition-all ${
                            selectedDate === date
                              ? 'bg-yellow-600 text-white'
                              : isEarly
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-400'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          <div>{new Date(date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}</div>
                          {isEarly && <div className="text-xs text-red-600">+R{(14 - daysDiff) * 300}</div>}
                        </button>
                      );
                    })}
                  </div>
                  {selectedPackage && selectedDate && isEarlyBooking(selectedDate) && (
                    <p className="text-yellow-500 text-xs mt-2">⚠️ Early booking fee of R{lateBookingFee} applies (R300/day for bookings less than 14 days)</p>
                  )}
                  {selectedPackage && <p className="text-blue-500 text-xs mt-2">📅 Recommended: Book at least 14 days in advance to avoid late fees</p>}
                </div>

                {/* Time Picker */}
                <div>
                  <label className="block text-white mb-2">Time</label>
                  {!selectedPackage ? (
                    <select
                      value={selectedTime}
                      onChange={(e) => handleTimeChange(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    >
                      <option value="">Select time</option>
                      {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  ) : (
                    <div>
                      <input type="text" value={getPackageStartTime(selectedPackage)} disabled className="w-full px-3 py-2 border rounded-md bg-gray-100" />
                      <p className="text-yellow-500 text-xs mt-1">⏰ Start time is fixed at {getPackageStartTime(selectedPackage)}:00 for this package</p>
                    </div>
                  )}
                </div>

                {/* Location */}
                <div className="md:col-span-2">
                  <label className="block text-white mb-2">Service Location</label>
                  <select value={location} onChange={e => setLocation(e.target.value)} disabled={!!selectedPackage} className="w-full px-3 py-2 border rounded-md mb-4">
                    <option value="studio">At Studio (No transport fee)</option>
                    <option value="mobile">Mobile Service (transport fee applies)</option>
                  </select>
                  {selectedPackage && <p className="text-yellow-500 text-xs mb-4">Packages are housecall only. Mobile service will be used.</p>}
                  {location === 'mobile' && (
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 gap-4">
                        <input
                          type="text"
                          placeholder="Search venue address or landmark"
                          value={customerLocation.address}
                          onChange={(e) => {
                            const addr = e.target.value;
                            setCustomerLocation(prev => ({ ...prev, address: addr }));
                            debouncedAddressSearch(addr);
                          }}
                          className="px-3 py-2 border rounded-md"
                        />
                        <button
                          type="button"
                          onClick={handleUseCurrentLocation}
                          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                        >
                          Use my current location
                        </button>
                      </div>
                      {calculatingDistance && <p className="text-blue-600">Calculating distance...</p>}
                      {customerLocation.distance > 0 && !calculatingDistance && (
                        <div className="bg-yellow-50 p-3 rounded">
                          <p>Distance: {customerLocation.distance} km</p>
                          <p>Transport Fee: R{(1000 + customerLocation.distance * 11.5).toFixed(2)}</p>
                          <p className="text-xs text-gray-600">(R1000 base + R11.50/km)</p>
                        </div>
                      )}
                      <div className="bg-green-50 p-3 rounded">
                        <p className="font-semibold">Studio Location:</p>
                        <p>{studioLocation.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-4">
                <button type="button" onClick={() => setStep(2)} className="flex-1 bg-gray-600 text-white py-3 rounded-lg">Back</button>
                <button type="button" onClick={() => setStep(4)} disabled={!selectedDate || !selectedTime || (location === 'mobile' && !customerLocation.address && !customerLocation.coordinates)} className="flex-1 bg-yellow-600 text-white py-3 rounded-lg disabled:bg-gray-400">Continue</button>
              </div>
            </div>
          )}

          {/* Step 4: Details & Summary */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Your Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <input type="text" placeholder="Full Name *" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} className="w-full px-3 py-2 border rounded-md mb-3" required />
                  <input type="email" placeholder="Email *" value={customerInfo.email} onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})} className="w-full px-3 py-2 border rounded-md mb-3" required />
                  <input type="tel" placeholder="Phone *" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} className="w-full px-3 py-2 border rounded-md mb-3" required />
                  <textarea placeholder="Notes (optional)" value={customerInfo.notes} onChange={e => setCustomerInfo({...customerInfo, notes: e.target.value})} rows="3" className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Order Summary</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {cartItems.map(item => (
                      <div key={item.service.id} className="flex justify-between mb-2">
                        <span>{item.service.name} {item.quantity > 1 && `×${item.quantity}`}</span>
                        <span>R{(parseFloat(item.service.base_price) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    {selectedPackage && (
                      <div className="flex justify-between mb-2">
                        <span>{selectedPackage.name}</span>
                        <span>R{parseFloat(selectedPackage.base_price).toFixed(2)}</span>
                      </div>
                    )}
                    {selectedAddons.map(a => (
                      <div key={a.addon.id} className="flex justify-between mb-2 text-sm">
                        <span>{a.addon.name} {a.quantity > 1 && `×${a.quantity}`}</span>
                        <span>R{(parseFloat(a.addon.price) * a.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    {transportFee > 0 && (
                      <div className="flex justify-between text-sm border-t pt-2 mt-2">
                        <span>Transport Fee</span>
                        <span>R{transportFee.toFixed(2)}</span>
                      </div>
                    )}
                    {lateBookingFee > 0 && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Late Booking Fee (R300/day)</span>
                        <span>R{lateBookingFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold border-t pt-2 mt-2">
                      <span>Total</span>
                      <span>R{finalTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-yellow-600 mt-2">
                      <span>Deposit (50%)</span>
                      <span>R{(finalTotal * 0.5).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-4">
                <button type="button" onClick={() => setStep(3)} className="flex-1 bg-gray-600 text-white py-3 rounded-lg">Back</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-yellow-600 text-white py-3 rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 flex items-center justify-center">
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    'Proceed to Payment'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Booking;