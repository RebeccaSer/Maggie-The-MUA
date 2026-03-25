import React, { useState, useEffect } from 'react';
import { authAPI } from '../utils/auth';
import { servicesAPI, appointmentsAPI, backendAuthAPI } from '../utils/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [addons, setAddons] = useState([]); // new
  const [editingService, setEditingService] = useState(null);
  const [editingAddon, setEditingAddon] = useState(null); // new
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    base_price: '',
    duration_minutes: '',
    allow_quantity: false,
    is_active: true,
    category: 'makeup'
  });
  const [newAddon, setNewAddon] = useState({ // new
    name: '',
    description: '',
    price: '',
    duration_minutes: '',
    service_id: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
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
        appointmentsAPI.getAppointments ? appointmentsAPI.getAppointments() : Promise.resolve({ data: { data: [] } }),
        servicesAPI.getAddons() // we added this in api.js
      ]);
      setServices(servicesRes.data.data || []);
      setAppointments(appointmentsRes.data.data || []);
      setAddons(addonsRes.data.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to sample data
      setServices(getSampleServices());
      setAppointments(getSampleAppointments());
      setAddons(getSampleAddons());
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
  };

  // Service CRUD (unchanged but now use real API)
  const handleSaveService = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingService === 'new') {
        // Create new service
        const res = await servicesAPI.createService(newService);
        setServices(prev => [...prev, res.data.data]);
      } else if (editingService) {
        // Update existing service
        const res = await servicesAPI.updateService(editingService.id, editingService);
        setServices(prev => prev.map(s => s.id === editingService.id ? res.data.data : s));
      }
      setEditingService(null);
      setNewService({
        name: '', description: '', base_price: '', duration_minutes: '',
        allow_quantity: false, is_active: true, category: 'makeup'
      });
      alert('Service saved successfully!');
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Error saving service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    setLoading(true);
    try {
      await servicesAPI.deleteService(serviceId);
      setServices(prev => prev.filter(s => s.id !== serviceId));
      alert('Service deleted successfully!');
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Error deleting service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleServiceStatus = async (serviceId) => {
    setLoading(true);
    try {
      const service = services.find(s => s.id === serviceId);
      const updated = { ...service, is_active: !service.is_active };
      const res = await servicesAPI.updateService(serviceId, updated);
      setServices(prev => prev.map(s => s.id === serviceId ? res.data.data : s));
    } catch (error) {
      console.error('Error updating service status:', error);
      alert('Error updating service status.');
    } finally {
      setLoading(false);
    }
  };

  // Add-on CRUD
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
      setNewAddon({ name: '', description: '', price: '', duration_minutes: '', service_id: '', is_active: true });
      alert('Add-on saved successfully!');
    } catch (error) {
      console.error('Error saving add-on:', error);
      alert('Error saving add-on. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddon = async (addonId) => {
    if (!window.confirm('Delete this add-on?')) return;
    setLoading(true);
    try {
      await servicesAPI.deleteAddon(addonId);
      setAddons(prev => prev.filter(a => a.id !== addonId));
    } catch (error) {
      console.error('Error deleting add-on:', error);
      alert('Error deleting add-on.');
    } finally {
      setLoading(false);
    }
  };

  // ... (rest of the component: header, tabs, etc.)
  // We'll add a new tab for addons and a corresponding component

  // For brevity, I'll show only the tab navigation and the new AddonsTab component.
  // The existing OverviewTab, ServicesTab, AppointmentsTab, PromotionsTab, SettingsTab remain similar
  // but now they use real data (e.g., services passed from state).

  return (
    <div className="min-h-screen bg-black">
      {/* Header (unchanged) */}
      <header className="bg-black shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-yellow-700 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">HER BY MAGGIE</h1>
                <p className="text-sm text-yellow-500">Admin Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-white">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs Navigation (add "Add-ons" tab) */}
      <div className="bg-black shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'services', name: 'Services', icon: '💄' },
              { id: 'addons', name: 'Add-ons', icon: '🎁' }, // new
              { id: 'appointments', name: 'Appointments', icon: '📅' },
              { id: 'promotions', name: 'Promotions', icon: '🎯' },
              { id: 'settings', name: 'Settings', icon: '⚙️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-white hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {loading && (
          <div className="fixed top-0 left-0 w-full h-1 bg-yellow-600 z-50">
            <div className="h-full bg-yellow-700 animate-pulse"></div>
          </div>
        )}

        <div className="px-4 py-6 sm:px-0">
          {activeTab === 'overview' && <OverviewTab appointments={appointments} services={services} />}
          {activeTab === 'services' && (
            <ServicesTab
              services={services}
              editingService={editingService}
              setEditingService={setEditingService}
              newService={newService}
              setNewService={setNewService}
              handleSaveService={handleSaveService}
              handleDeleteService={handleDeleteService}
              toggleServiceStatus={toggleServiceStatus}
              loading={loading}
            />
          )}
          {activeTab === 'addons' && (
            <AddonsTab
              addons={addons}
              services={services}
              editingAddon={editingAddon}
              setEditingAddon={setEditingAddon}
              newAddon={newAddon}
              setNewAddon={setNewAddon}
              handleSaveAddon={handleSaveAddon}
              handleDeleteAddon={handleDeleteAddon}
              loading={loading}
            />
          )}
          {activeTab === 'appointments' && <AppointmentsTab appointments={appointments} />}
          {activeTab === 'promotions' && <PromotionsTab />}
          {activeTab === 'settings' && <SettingsTab user={user} />}
        </div>
      </main>
    </div>
  );
};

// OverviewTab, ServicesTab, AppointmentsTab, PromotionsTab, SettingsTab remain mostly the same as before
// but we'll show the new AddonsTab component.

const AddonsTab = ({ addons, services, editingAddon, setEditingAddon, newAddon, setNewAddon, handleSaveAddon, handleDeleteAddon, loading }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    handleSaveAddon(e);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Manage Add-ons</h2>
        <button
          onClick={() => setEditingAddon('new')}
          className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
        >
          Add New Add-on
        </button>
      </div>

      {/* Add-on Form */}
      {(editingAddon === 'new' || editingAddon) && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">{editingAddon === 'new' ? 'Add New Add-on' : 'Edit Add-on'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={editingAddon === 'new' ? newAddon.name : editingAddon.name}
                onChange={e => editingAddon === 'new' ? setNewAddon({...newAddon, name: e.target.value}) : setEditingAddon({...editingAddon, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Associated Service (optional)</label>
              <select
                value={editingAddon === 'new' ? newAddon.service_id : editingAddon.service_id}
                onChange={e => editingAddon === 'new' ? setNewAddon({...newAddon, service_id: e.target.value}) : setEditingAddon({...editingAddon, service_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={loading}
              >
                <option value="">Global (all services)</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>{service.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (R) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={editingAddon === 'new' ? newAddon.price : editingAddon.price}
                onChange={e => editingAddon === 'new' ? setNewAddon({...newAddon, price: e.target.value}) : setEditingAddon({...editingAddon, price: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) *</label>
              <input
                type="number"
                min="1"
                value={editingAddon === 'new' ? newAddon.duration_minutes : editingAddon.duration_minutes}
                onChange={e => editingAddon === 'new' ? setNewAddon({...newAddon, duration_minutes: e.target.value}) : setEditingAddon({...editingAddon, duration_minutes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                disabled={loading}
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={editingAddon === 'new' ? newAddon.description : editingAddon.description}
              onChange={e => editingAddon === 'new' ? setNewAddon({...newAddon, description: e.target.value}) : setEditingAddon({...editingAddon, description: e.target.value})}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
              disabled={loading}
            />
          </div>
          <div className="flex items-center space-x-4 mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={editingAddon === 'new' ? newAddon.is_active : editingAddon.is_active}
                onChange={e => editingAddon === 'new' ? setNewAddon({...newAddon, is_active: e.target.checked}) : setEditingAddon({...editingAddon, is_active: e.target.checked})}
                className="mr-2"
                disabled={loading}
              />
              Active
            </label>
          </div>
          <div className="flex space-x-3">
            <button type="submit" disabled={loading} className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Add-on'}
            </button>
            <button type="button" onClick={() => setEditingAddon(null)} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Add-ons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {addons.map(addon => (
          <div key={addon.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-lg text-gray-900 mb-2">{addon.name}</h3>
            <p className="text-gray-600 text-sm mb-3">{addon.description}</p>
            <div className="flex justify-between items-center mb-2">
              <span className="text-pink-600 font-bold text-lg">R{addon.price}</span>
              <span className="text-gray-500 text-sm">{addon.duration_minutes} mins</span>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              {addon.service_id ? `Linked to: ${services.find(s => s.id === addon.service_id)?.name}` : 'Global add-on'}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setEditingAddon(addon)}
                className="flex-1 bg-gray-600 text-white py-2 rounded hover:bg-gray-700 transition-colors text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteAddon(addon.id)}
                className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {addons.length === 0 && !editingAddon && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎁</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No add-ons yet</h3>
          <p className="text-gray-500 mb-4">Create add-ons to enhance services (e.g., false lashes, bridesmaid makeup)</p>
          <button
            onClick={() => setEditingAddon('new')}
            className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors"
          >
            Create Your First Add-on
          </button>
        </div>
      )}
    </div>
  );
};

// Sample data functions (fallback)
const getSampleServices = () => [
  { id: 1, name: 'Basic Makeup', description: 'Natural everyday makeup', base_price: 350, duration_minutes: 60, allow_quantity: true, is_active: true, category: 'makeup' }
];
const getSampleAppointments = () => [
  { id: 1, customer_name: 'Sarah Johnson', customer_email: 'sarah@example.com', service_name: 'Bridal Makeup', appointment_date: '2024-01-20T10:00:00Z', status: 'confirmed', total_price: 1200 }
];
const getSampleAddons = () => [
  { id: 1, name: 'False Lashes', description: 'Premium lashes', price: 50, duration_minutes: 15, service_id: null, is_active: true }
];

export default AdminDashboard;