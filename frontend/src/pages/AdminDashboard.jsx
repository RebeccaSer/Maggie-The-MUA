import React, { useState, useEffect } from 'react';
import { authAPI } from '../utils/auth';
import { servicesAPI, appointmentsAPI } from '../utils/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [addons, setAddons] = useState([]);
  const [editingService, setEditingService] = useState(null);
  const [editingAddon, setEditingAddon] = useState(null);
  const [newService, setNewService] = useState({
    name: '', description: '', base_price: '', duration_minutes: '', allow_quantity: false, is_active: true, category: 'makeup'
  });
  const [newAddon, setNewAddon] = useState({
    name: '', description: '', price: '', duration_minutes: '', service_id: '', is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    setUser(currentUser);
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [servicesRes, appointmentsRes, addonsRes] = await Promise.all([
        servicesAPI.getServices(),
        appointmentsAPI.getAppointments(),
        servicesAPI.getAddons()
      ]);
      setServices(servicesRes.data.data || []);
      setAppointments(appointmentsRes.data.data || []);
      setAddons(addonsRes.data.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => authAPI.logout();

  const handleSaveService = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingService === 'new') {
        const res = await servicesAPI.createService(newService);
        setServices(prev => [...prev, res.data.data]);
      } else if (editingService) {
        const res = await servicesAPI.updateService(editingService.id, editingService);
        setServices(prev => prev.map(s => s.id === editingService.id ? res.data.data : s));
      }
      setEditingService(null);
      setNewService({ name:'', description:'', base_price:'', duration_minutes:'', allow_quantity:false, is_active:true, category:'makeup' });
    } catch (err) { setError('Failed to save service'); } finally { setLoading(false); }
  };

  const handleDeleteService = async (id) => {
    if (!confirm('Delete this service?')) return;
    setLoading(true);
    try {
      await servicesAPI.deleteService(id);
      setServices(prev => prev.filter(s => s.id !== id));
    } catch (err) { setError('Failed to delete'); } finally { setLoading(false); }
  };

  const toggleServiceStatus = async (id) => {
    setLoading(true);
    try {
      const service = services.find(s => s.id === id);
      const updated = { ...service, is_active: !service.is_active };
      const res = await servicesAPI.updateService(id, updated);
      setServices(prev => prev.map(s => s.id === id ? res.data.data : s));
    } catch (err) { setError('Failed to update status'); } finally { setLoading(false); }
  };

  const handleSaveAddon = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingAddon === 'new') {
        const res = await servicesAPI.createAddon(newAddon);
        setAddons(prev => [...prev, res.data.data]);
      } else if (editingAddon) {
        const res = await servicesAPI.updateAddon(editingAddon.id, editingAddon);
        setAddons(prev => prev.map(a => a.id === editingAddon.id ? res.data.data : a));
      }
      setEditingAddon(null);
      setNewAddon({ name:'', description:'', price:'', duration_minutes:'', service_id:'', is_active:true });
    } catch (err) { setError('Failed to save addon'); } finally { setLoading(false); }
  };

  const handleDeleteAddon = async (id) => {
    if (!confirm('Delete this add-on?')) return;
    setLoading(true);
    try {
      await servicesAPI.deleteAddon(id);
      setAddons(prev => prev.filter(a => a.id !== id));
    } catch (err) { setError('Failed to delete addon'); } finally { setLoading(false); }
  };

  if (!user) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div></div>;
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="bg-black border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-yellow-700 rounded-full flex items-center justify-center"><span className="text-white font-bold">M</span></div>
            <h1 className="text-xl font-bold text-white">HER BY MAGGIE</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-white">{user.first_name} {user.last_name}</span>
            <button onClick={handleLogout} className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm">Logout</button>
          </div>
        </div>
      </header>

      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {['overview','services','addons','appointments','availability','promotions','settings'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 px-1 border-b-2 text-sm font-medium ${activeTab === tab ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-white'}`}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {loading && <div className="fixed top-0 left-0 w-full h-1 bg-yellow-600 animate-pulse"></div>}
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        {activeTab === 'overview' && <OverviewTab appointments={appointments} services={services} />}
        {activeTab === 'services' && <ServicesTab services={services} editingService={editingService} setEditingService={setEditingService} newService={newService} setNewService={setNewService} handleSaveService={handleSaveService} handleDeleteService={handleDeleteService} toggleServiceStatus={toggleServiceStatus} loading={loading} />}
        {activeTab === 'addons' && <AddonsTab addons={addons} services={services} editingAddon={editingAddon} setEditingAddon={setEditingAddon} newAddon={newAddon} setNewAddon={setNewAddon} handleSaveAddon={handleSaveAddon} handleDeleteAddon={handleDeleteAddon} loading={loading} />}
        {activeTab === 'appointments' && <AppointmentsTab appointments={appointments} onRefresh={loadInitialData} />}
        {activeTab === 'availability' && <AvailabilityTab />}
        {activeTab === 'promotions' && <PromotionsTab />}
        {activeTab === 'settings' && <SettingsTab user={user} />}
      </main>
    </div>
  );
};

// Helper
const formatPrice = (p) => { const n = parseFloat(p); return isNaN(n) ? '0.00' : n.toFixed(2); };

// Overview Tab
const OverviewTab = ({ appointments, services }) => {
  const totalRevenue = appointments.reduce((s,a) => s + (parseFloat(a.total_price)||0), 0);
  const depositTotal = appointments.reduce((s,a) => s + (parseFloat(a.deposit_amount)||0), 0);
  const pending = appointments.filter(a => a.status === 'pending').length;
  const confirmed = appointments.filter(a => a.status === 'confirmed').length;
  const completed = appointments.filter(a => a.status === 'completed').length;
  const cancelled = appointments.filter(a => a.status === 'cancelled').length;
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Dashboard</h2>
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-black border border-gray-200 rounded-lg p-6"><p className="text-white text-sm">Total Appointments</p><p className="text-2xl font-bold text-white">{appointments.length}</p></div>
        <div className="bg-black border border-gray-200 rounded-lg p-6"><p className="text-white text-sm">Active Services</p><p className="text-2xl font-bold text-white">{services.filter(s=>s.is_active).length}</p></div>
        <div className="bg-black border border-gray-200 rounded-lg p-6"><p className="text-white text-sm">Total Revenue</p><p className="text-2xl font-bold text-white">R{formatPrice(totalRevenue)}</p></div>
        <div className="bg-black border border-gray-200 rounded-lg p-6"><p className="text-white text-sm">Pending</p><p className="text-2xl font-bold text-white">{pending}</p></div>
      </div>
      <div className="bg-black border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">Recent Appointments</h3>
        {appointments.slice(0,5).map(apt => {
          let name = 'Guest';
          try { if(apt.customer_info) name = JSON.parse(apt.customer_info)?.name || 'Guest'; } catch(e) {}
          return <div key={apt.id} className="flex justify-between py-2 border-b border-gray-700"><span className="text-white">{name}</span><span className="text-white">{new Date(apt.appointment_date).toLocaleDateString()}</span><span className={`px-2 rounded-full text-xs ${apt.status==='confirmed'?'bg-green-100 text-green-800':apt.status==='pending'?'bg-yellow-100 text-yellow-800':'bg-gray-100'}`}>{apt.status}</span></div>;
        })}
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-black border p-6"><h4 className="text-white font-medium">Status</h4><div className="space-y-1 text-white"><div>Confirmed: {confirmed}</div><div>Pending: {pending}</div><div>Completed: {completed}</div><div>Cancelled: {cancelled}</div></div></div>
        <div className="bg-black border p-6"><h4 className="text-white font-medium">Financial</h4><div className="text-white">Revenue: R{formatPrice(totalRevenue)}<br/>Deposits: R{formatPrice(depositTotal)}<br/>Balance: R{formatPrice(totalRevenue-depositTotal)}</div></div>
        <div className="bg-black border p-6"><h4 className="text-white font-medium">Services</h4><div className="text-white">Active: {services.filter(s=>s.is_active).length}<br/>Inactive: {services.filter(s=>!s.is_active).length}</div></div>
      </div>
    </div>
  );
};

// Services Tab
const ServicesTab = ({ services, editingService, setEditingService, newService, setNewService, handleSaveService, handleDeleteService, toggleServiceStatus, loading }) => (
  <div className="space-y-6"><div className="flex justify-between"><h2 className="text-2xl font-bold text-white">Services</h2><button onClick={() => setEditingService('new')} className="bg-yellow-600 text-white px-4 py-2 rounded">+ Add</button></div>
  {(editingService === 'new' || editingService) && (
    <form onSubmit={handleSaveService} className="bg-white p-6 rounded mb-6">
      <h3 className="text-lg font-semibold mb-4">{editingService === 'new' ? 'New Service' : 'Edit Service'}</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <input placeholder="Name" value={editingService==='new'?newService.name:editingService.name} onChange={e => editingService==='new'?setNewService({...newService,name:e.target.value}):setEditingService({...editingService,name:e.target.value})} className="border p-2 rounded" required />
        <input placeholder="Price" type="number" step="0.01" value={editingService==='new'?newService.base_price:editingService.base_price} onChange={e => editingService==='new'?setNewService({...newService,base_price:e.target.value}):setEditingService({...editingService,base_price:e.target.value})} className="border p-2 rounded" required />
        <input placeholder="Duration (min)" type="number" value={editingService==='new'?newService.duration_minutes:editingService.duration_minutes} onChange={e => editingService==='new'?setNewService({...newService,duration_minutes:e.target.value}):setEditingService({...editingService,duration_minutes:e.target.value})} className="border p-2 rounded" required />
        <select value={editingService==='new'?newService.category:editingService.category} onChange={e => editingService==='new'?setNewService({...newService,category:e.target.value}):setEditingService({...editingService,category:e.target.value})} className="border p-2 rounded"><option value="makeup">Makeup</option><option value="hair">Hair</option><option value="bridal">Bridal</option></select>
      </div>
      <textarea placeholder="Description" rows="2" value={editingService==='new'?newService.description:editingService.description} onChange={e => editingService==='new'?setNewService({...newService,description:e.target.value}):setEditingService({...editingService,description:e.target.value})} className="w-full border p-2 rounded mb-4" required />
      <div className="flex items-center space-x-4 mb-4"><label><input type="checkbox" checked={editingService==='new'?newService.allow_quantity:editingService.allow_quantity} onChange={e => editingService==='new'?setNewService({...newService,allow_quantity:e.target.checked}):setEditingService({...editingService,allow_quantity:e.target.checked})} /> Allow quantity</label><label><input type="checkbox" checked={editingService==='new'?newService.is_active:editingService.is_active} onChange={e => editingService==='new'?setNewService({...newService,is_active:e.target.checked}):setEditingService({...editingService,is_active:e.target.checked})} /> Active</label></div>
      <div className="flex space-x-2"><button type="submit" disabled={loading} className="bg-yellow-600 text-white px-4 py-2 rounded">Save</button><button type="button" onClick={() => setEditingService(null)} className="bg-gray-600 text-white px-4 py-2 rounded">Cancel</button></div>
    </form>
  )}
  <div className="grid grid-cols-3 gap-6">
    {services.map(s => (
      <div key={s.id} className="bg-white p-4 rounded shadow">
        <div className="flex justify-between"><h3 className="font-semibold">{s.name}</h3><span className={`text-xs px-2 py-1 rounded ${s.is_active?'bg-green-100 text-green-800':'bg-red-100 text-red-800'}`}>{s.is_active?'Active':'Inactive'}</span></div>
        <p className="text-sm text-gray-600">{s.description}</p>
        <div className="flex justify-between mt-2"><span className="text-yellow-600 font-bold">R{formatPrice(s.base_price)}</span><span>{s.duration_minutes} min</span></div>
        <div className="flex space-x-2 mt-4"><button onClick={() => setEditingService(s)} className="flex-1 bg-gray-600 text-white py-1 rounded text-sm">Edit</button><button onClick={() => toggleServiceStatus(s.id)} className={`flex-1 py-1 rounded text-sm ${s.is_active?'bg-yellow-600':'bg-green-600'} text-white`}>{s.is_active?'Deactivate':'Activate'}</button><button onClick={() => handleDeleteService(s.id)} className="flex-1 bg-red-600 text-white py-1 rounded text-sm">Delete</button></div>
      </div>
    ))}
  </div></div>
);

// Add-ons Tab
const AddonsTab = ({ addons, services, editingAddon, setEditingAddon, newAddon, setNewAddon, handleSaveAddon, handleDeleteAddon, loading }) => (
  <div className="space-y-6"><div className="flex justify-between"><h2 className="text-2xl font-bold text-white">Add-ons</h2><button onClick={() => setEditingAddon('new')} className="bg-yellow-600 text-white px-4 py-2 rounded">+ Add</button></div>
  {(editingAddon === 'new' || editingAddon) && (
    <form onSubmit={handleSaveAddon} className="bg-white p-6 rounded mb-6">
      <h3 className="text-lg font-semibold mb-4">{editingAddon==='new'?'New Add-on':'Edit Add-on'}</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <input placeholder="Name" value={editingAddon==='new'?newAddon.name:editingAddon.name} onChange={e => editingAddon==='new'?setNewAddon({...newAddon,name:e.target.value}):setEditingAddon({...editingAddon,name:e.target.value})} className="border p-2 rounded" required />
        <select value={editingAddon==='new'?newAddon.service_id:editingAddon.service_id} onChange={e => editingAddon==='new'?setNewAddon({...newAddon,service_id:e.target.value}):setEditingAddon({...editingAddon,service_id:e.target.value})} className="border p-2 rounded"><option value="">Global</option>{services.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <input placeholder="Price" type="number" step="0.01" value={editingAddon==='new'?newAddon.price:editingAddon.price} onChange={e => editingAddon==='new'?setNewAddon({...newAddon,price:e.target.value}):setEditingAddon({...editingAddon,price:e.target.value})} className="border p-2 rounded" required />
        <input placeholder="Duration (min)" type="number" value={editingAddon==='new'?newAddon.duration_minutes:editingAddon.duration_minutes} onChange={e => editingAddon==='new'?setNewAddon({...newAddon,duration_minutes:e.target.value}):setEditingAddon({...editingAddon,duration_minutes:e.target.value})} className="border p-2 rounded" required />
      </div>
      <textarea placeholder="Description" rows="2" value={editingAddon==='new'?newAddon.description:editingAddon.description} onChange={e => editingAddon==='new'?setNewAddon({...newAddon,description:e.target.value}):setEditingAddon({...editingAddon,description:e.target.value})} className="w-full border p-2 rounded mb-4" required />
      <div className="flex items-center mb-4"><label><input type="checkbox" checked={editingAddon==='new'?newAddon.is_active:editingAddon.is_active} onChange={e => editingAddon==='new'?setNewAddon({...newAddon,is_active:e.target.checked}):setEditingAddon({...editingAddon,is_active:e.target.checked})} /> Active</label></div>
      <div className="flex space-x-2"><button type="submit" disabled={loading} className="bg-yellow-600 text-white px-4 py-2 rounded">Save</button><button type="button" onClick={() => setEditingAddon(null)} className="bg-gray-600 text-white px-4 py-2 rounded">Cancel</button></div>
    </form>
  )}
  <div className="grid grid-cols-3 gap-6">
    {addons.map(a => (
      <div key={a.id} className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold">{a.name}</h3>
        <p className="text-sm text-gray-600">{a.description}</p>
        <div className="flex justify-between mt-2"><span className="text-yellow-600 font-bold">R{formatPrice(a.price)}</span><span>{a.duration_minutes} min</span></div>
        <p className="text-xs text-gray-500 mt-1">{a.service_id ? `Linked to: ${services.find(s=>s.id===a.service_id)?.name}` : 'Global'}</p>
        <div className="flex space-x-2 mt-4"><button onClick={() => setEditingAddon(a)} className="flex-1 bg-gray-600 text-white py-1 rounded text-sm">Edit</button><button onClick={() => handleDeleteAddon(a.id)} className="flex-1 bg-red-600 text-white py-1 rounded text-sm">Delete</button></div>
      </div>
    ))}
  </div></div>
);

const AppointmentsTab = ({ appointments, onRefresh }) => {
    const [editingAppointment, setEditingAppointment] = useState(null);
    const [newDateTime, setNewDateTime] = useState('');
    const [editReason, setEditReason] = useState('');
    const [showCancelConfirm, setShowCancelConfirm] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUpdate = async () => {
        if (!editingAppointment || !newDateTime) return;
        setLoading(true);
        try {
            await appointmentsAPI.updateAppointment(editingAppointment.id, { 
                appointment_date: newDateTime,
                reason: editReason 
            });
            alert('Appointment updated successfully');
            setEditingAppointment(null);
            setEditReason('');
            onRefresh();
        } catch (err) {
            alert(err.response?.data?.error || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!showCancelConfirm) return;
        setLoading(true);
        try {
            await appointmentsAPI.cancelAppointment(showCancelConfirm, { reason: cancelReason });
            alert('Appointment cancelled');
            setShowCancelConfirm(null);
            setCancelReason('');
            onRefresh();
        } catch (err) {
            alert(err.response?.data?.error || 'Cancel failed');
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (p) => { const n = parseFloat(p); return isNaN(n) ? '0.00' : n.toFixed(2); };

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-4">Appointments</h2>
            <div className="bg-white rounded shadow overflow-x-auto">
                <table className="w-full table-auto">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking Ref</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Services</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {appointments.map(apt => {
                            let customerName = 'Guest', customerEmail = '', customerPhone = '', notes = '';
                            try {
                                if (apt.customer_info) {
                                    const info = typeof apt.customer_info === 'string' ? JSON.parse(apt.customer_info) : apt.customer_info;
                                    customerName = info?.name || 'Guest';
                                    customerEmail = info?.email || '';
                                    customerPhone = info?.phone || '';
                                    notes = info?.notes || '';
                                }
                            } catch(e) { console.error(e); }

                            let servicesList = '';
                            if (apt.services && apt.services.length) {
                                servicesList = apt.services.map(s => `${s.name} x${s.quantity}`).join(', ');
                            } else if (apt.packages && apt.packages.length) {
                                servicesList = apt.packages.map(p => `${p.name} x${p.quantity}`).join(', ');
                            } else {
                                servicesList = 'N/A';
                            }

                            const address = apt.location_address === 'studio' ? 'Studio' : apt.location_address || 'Not provided';
                            const isEditable = apt.status !== 'cancelled';

                            return (
                                <tr key={apt.id}>
                                    <td className="px-3 py-4 text-sm text-gray-900">{apt.booking_reference || apt.id}</td>
                                    <td className="px-3 py-4 text-sm text-gray-900">{customerName}</td>
                                    <td className="px-3 py-4 text-sm text-gray-900">
                                        {customerEmail && <div>{customerEmail}</div>}
                                        {customerPhone && <div>{customerPhone}</div>}
                                    </td>
                                    <td className="px-3 py-4 text-sm text-gray-900">{servicesList}</td>
                                    <td className="px-3 py-4 text-sm text-gray-900">{new Date(apt.appointment_date).toLocaleString()}</td>
                                    <td className="px-3 py-4 text-sm text-gray-900">{address}</td>
                                    <td className="px-3 py-4 text-sm text-gray-900">{notes}</td>
                                    <td className="px-3 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            apt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                            apt.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            apt.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100'
                                        }`}>
                                            {apt.status}
                                        </span>
                                    </td>
                                    <td className="px-3 py-4 text-sm text-gray-900">R{formatPrice(apt.total_price)}</td>
                                    <td className="px-3 py-4 text-sm text-gray-900">
                                        {isEditable && (
                                            <div className="flex space-x-2">
                                                <button onClick={() => { setEditingAppointment(apt); setNewDateTime(apt.appointment_date.slice(0,16)); }} className="text-blue-600 hover:text-blue-800">Edit</button>
                                                <button onClick={() => setShowCancelConfirm(apt.id)} className="text-red-600 hover:text-red-800">Cancel</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>


            {/* Edit Modal */}
            {editingAppointment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-4">Reschedule Appointment</h3>
                        <label className="block text-sm font-medium mb-1">New Date & Time</label>
                        <input type="datetime-local" value={newDateTime} onChange={e => setNewDateTime(e.target.value)} className="w-full border rounded p-2 mb-4" />
                        <label className="block text-sm font-medium mb-1">Reason for rescheduling</label>
                        <textarea value={editReason} onChange={e => setEditReason(e.target.value)} rows="3" className="w-full border rounded p-2 mb-4" placeholder="Enter reason (will be sent to customer)" />
                        <div className="flex justify-end space-x-2">
                            <button onClick={() => { setEditingAppointment(null); setEditReason(''); }} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
                            <button onClick={handleUpdate} disabled={loading} className="px-4 py-2 bg-yellow-600 text-white rounded">Update</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Modal */}
            {showCancelConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-4">Cancel Appointment</h3>
                        <p className="mb-4">Are you sure you want to cancel this appointment? This action cannot be undone.</p>
                        <label className="block text-sm font-medium mb-1">Reason for cancellation</label>
                        <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows="3" className="w-full border rounded p-2 mb-4" placeholder="Enter reason (will be sent to customer)" />
                        <div className="flex justify-end space-x-2 mt-4">
                            <button onClick={() => { setShowCancelConfirm(null); setCancelReason(''); }} className="px-4 py-2 bg-gray-300 rounded">No, Go Back</button>
                            <button onClick={handleCancel} disabled={loading} className="px-4 py-2 bg-red-600 text-white rounded">Yes, Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Availability Tab (full-day + time-slot blocks)
const AvailabilityTab = () => {
    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const [blockedDates, setBlockedDates] = useState([]);
    const [blockedSlots, setBlockedSlots] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedStartTime, setSelectedStartTime] = useState('');
    const [selectedEndTime, setSelectedEndTime] = useState('');
    const [slotReason, setSlotReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState('dates');

    useEffect(() => {
        fetchBlockedDates();
        fetchBlockedSlots();
    }, []);

    const fetchBlockedDates = async () => {
        try {
            const res = await fetch(`${API_BASE}/availability`);
            const data = await res.json();
            if (data.success) setBlockedDates(data.data);
        } catch (err) { console.error(err); }
    };

    const fetchBlockedSlots = async () => {
        try {
            const res = await fetch(`${API_BASE}/availability/slots`);
            const data = await res.json();
            if (data.success) setBlockedSlots(data.data);
        } catch (err) { console.error(err); }
    };

    const blockDate = async () => {
        if (!selectedDate) return;
        setLoading(true);
        try {
            await fetch(`${API_BASE}/availability/block`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: selectedDate, reason: slotReason })
            });
            await fetchBlockedDates();
            setSelectedDate('');
            setSlotReason('');
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const unblockDate = async (date) => {
        if (!confirm(`Unblock full day ${date}?`)) return;
        try {
            await fetch(`${API_BASE}/availability/block/${date}`, { method: 'DELETE' });
            await fetchBlockedDates();
        } catch (err) { console.error(err); }
    };

    const blockSlot = async () => {
        if (!selectedDate || !selectedStartTime || !selectedEndTime) {
            alert('Please select date, start time, and end time');
            return;
        }
        setLoading(true);
        try {
            await fetch(`${API_BASE}/availability/slots`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    block_date: selectedDate,
                    start_time: selectedStartTime,
                    end_time: selectedEndTime,
                    reason: slotReason
                })
            });
            await fetchBlockedSlots();
            setSelectedDate('');
            setSelectedStartTime('');
            setSelectedEndTime('');
            setSlotReason('');
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const unblockSlot = async (id) => {
        if (!confirm('Unblock this time slot?')) return;
        try {
            await fetch(`${API_BASE}/availability/slots/${id}`, { method: 'DELETE' });
            await fetchBlockedSlots();
        } catch (err) { console.error(err); }
    };

    const formatTime = (time) => time.substring(0, 5);

    return (
        <div className="space-y-8">
            <div className="flex space-x-4 border-b border-gray-200 pb-2">
                <button onClick={() => setView('dates')} className={`px-4 py-2 ${view === 'dates' ? 'text-yellow-600 border-b-2 border-yellow-600' : 'text-white'}`}>Full-Day Blocks</button>
                <button onClick={() => setView('slots')} className={`px-4 py-2 ${view === 'slots' ? 'text-yellow-600 border-b-2 border-yellow-600' : 'text-white'}`}>Time-Slot Blocks</button>
            </div>

            {view === 'dates' && (
                <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Block Full Days</h2>
                    <div className="bg-white p-4 rounded mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="border p-2 rounded" />
                            <input type="text" placeholder="Reason (optional)" value={slotReason} onChange={e => setSlotReason(e.target.value)} className="border p-2 rounded" />
                        </div>
                        <button onClick={blockDate} disabled={!selectedDate || loading} className="mt-3 bg-red-600 text-white px-4 py-2 rounded">Block Full Day</button>
                    </div>
                    <div className="bg-white p-4 rounded">
                        <h3 className="font-semibold mb-2">Blocked Dates</h3>
                        {blockedDates.length === 0 ? <p>No blocked dates.</p> : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {blockedDates.map(item => (
                                    <div key={item.unavailable_date} className="bg-gray-100 p-2 rounded flex justify-between items-center">
                                        <span>{new Date(item.unavailable_date).toLocaleDateString()}</span>
                                        <button onClick={() => unblockDate(item.unavailable_date)} className="text-red-600 text-sm">Unblock</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {view === 'slots' && (
                <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Block Time Slots</h2>
                    <div className="bg-white p-4 rounded mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="border p-2 rounded" />
                            <input type="time" value={selectedStartTime} onChange={e => setSelectedStartTime(e.target.value)} className="border p-2 rounded" />
                            <input type="time" value={selectedEndTime} onChange={e => setSelectedEndTime(e.target.value)} className="border p-2 rounded" />
                            <input type="text" placeholder="Reason" value={slotReason} onChange={e => setSlotReason(e.target.value)} className="border p-2 rounded" />
                        </div>
                        <button onClick={blockSlot} disabled={!selectedDate || !selectedStartTime || !selectedEndTime || loading} className="bg-red-600 text-white px-4 py-2 rounded">Block Time Slot</button>
                    </div>
                    <div className="bg-white p-4 rounded">
                        <h3 className="font-semibold mb-2">Blocked Time Slots</h3>
                        {blockedSlots.length === 0 ? <p>No time slots blocked.</p> : (
                            <table className="min-w-full">
                                <thead className="bg-gray-100">
                                    <tr><th className="p-2 text-left">Date</th><th className="p-2 text-left">Start</th><th className="p-2 text-left">End</th><th className="p-2 text-left">Reason</th><th className="p-2"></th></tr>
                                </thead>
                                <tbody>
                                    {blockedSlots.map(slot => (
                                        <tr key={slot.id} className="border-b">
                                            <td className="p-2">{new Date(slot.block_date).toLocaleDateString()}</td>
                                            <td className="p-2">{formatTime(slot.start_time)}</td>
                                            <td className="p-2">{formatTime(slot.end_time)}</td>
                                            <td className="p-2">{slot.reason || '-'}</td>
                                            <td className="p-2"><button onClick={() => unblockSlot(slot.id)} className="text-red-600 text-sm">Unblock</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Promotions Tab (placeholder – can be extended)
const PromotionsTab = () => <div className="bg-white p-6 rounded"><p className="text-gray-600">Promotions coming soon...</p></div>;

// Settings Tab
const SettingsTab = ({ user }) => <div className="bg-white p-6 rounded"><h3 className="text-lg font-semibold mb-4">Admin Profile</h3><p><strong>Name:</strong> {user?.first_name} {user?.last_name}</p><p><strong>Email:</strong> {user?.email}</p><p><strong>Role:</strong> {user?.role}</p></div>;

export default AdminDashboard; 