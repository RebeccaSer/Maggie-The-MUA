import React, { useState, useEffect } from 'react';
import { authAPI } from '../utils/auth';
import { servicesAPI, appointmentsAPI, backendAuthAPI } from '../utils/api';
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [editingService, setEditingService] = useState(null);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    base_price: '',
    duration_minutes: '',
    allow_quantity: false,
    is_active: true,
    category: 'makeup'
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
      const [servicesRes, appointmentsRes] = await Promise.all([
        servicesAPI.getServices(),
        appointmentsAPI.getAppointments ? appointmentsAPI.getAppointments() : Promise.resolve({ data: { data: [] } })
      ]);
      
      setServices(servicesRes.data.data || []);
      setAppointments(appointmentsRes.data.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to sample data
      setServices(getSampleServices());
      setAppointments(getSampleAppointments());
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Here you would call your backend API to save the service
      console.log('Saving service:', editingService || newService);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (editingService === 'new') {
        // Add new service
        const newServiceWithId = {
          ...newService,
          id: Date.now(),
          created_at: new Date().toISOString()
        };
        setServices(prev => [...prev, newServiceWithId]);
      } else if (editingService) {
        // Update existing service
        setServices(prev => prev.map(s => 
          s.id === editingService.id ? { ...editingService, updated_at: new Date().toISOString() } : s
        ));
      }
      
      // Reset form
      setEditingService(null);
      setNewService({
        name: '',
        description: '',
        base_price: '',
        duration_minutes: '',
        allow_quantity: false,
        is_active: true,
        category: 'makeup'
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      setServices(prev => prev.map(s => 
        s.id === serviceId ? { ...s, is_active: !s.is_active } : s
      ));
    } catch (error) {
      console.error('Error updating service status:', error);
      alert('Error updating service status.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
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
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-white">{user.email}</p>
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

      {/* Tabs Navigation */}
      <div className="bg-black shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'services', name: 'Services', icon: '💄' },
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {loading && (
          <div className="fixed top-0 left-0 w-full h-1 bg-yellow-600 z-50">
            <div className="h-full bg-yellow-700 animate-pulse"></div>
          </div>
        )}

        <div className="px-4 py-6 sm:px-0">
          {activeTab === 'overview' && (
            <OverviewTab appointments={appointments} services={services} />
          )}
          
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
          
          {activeTab === 'appointments' && (
            <AppointmentsTab appointments={appointments} />
          )}
          
          {activeTab === 'promotions' && (
            <PromotionsTab />
          )}
          
          {activeTab === 'settings' && (
            <SettingsTab user={user} />
          )}
        </div>
      </main>
    </div>
  );
};

// Tab Components
const OverviewTab = ({ appointments, services }) => {
  const stats = [
    { 
      name: 'Total Appointments', 
      value: appointments.length.toString(), 
      change: '+12%', 
      changeType: 'positive',
      icon: '📅'
    },
    { 
      name: 'Active Services', 
      value: services.filter(s => s.is_active).length.toString(), 
      change: '+2', 
      changeType: 'positive',
      icon: '💄'
    },
    { 
      name: 'Revenue This Month', 
      value: 'R18,400', 
      change: '+R2,100', 
      changeType: 'positive',
      icon: '💰'
    },
    { 
      name: 'Pending Bookings', 
      value: appointments.filter(a => a.status === 'pending').length.toString(), 
      change: '-1', 
      changeType: 'negative',
      icon: '⏳'
    }
  ];

  const recentAppointments = appointments.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
        <div className="text-sm text-white">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-black rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{stat.name}</p>
                <p className="text-2xl font-semibold text-white mt-1">{stat.value}</p>
              </div>
              <div className="text-2xl">{stat.icon}</div>
            </div>
            <div className={`mt-2 text-sm ${
              stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
            }`}>
              {stat.change} from last month
            </div>
          </div>
        ))}
      </div>

      {/* Recent Appointments */}
      <div className="bg-black rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-white">
          <h3 className="text-lg font-medium text-white">Recent Appointments</h3>
        </div>
        <div className="p-6">
          {recentAppointments.length > 0 ? (
            <div className="space-y-4">
              {recentAppointments.map(appointment => (
                <div key={appointment.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-white">
                      {appointment.customer_name || 'Customer'}
                    </p>
                    <p className="text-sm text-white">
                      {new Date(appointment.appointment_date).toLocaleDateString()} • 
                      {appointment.service_name || 'Service'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {appointment.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white-500 text-center py-4">No appointments yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

const ServicesTab = ({ 
  services, 
  editingService, 
  setEditingService, 
  newService, 
  setNewService, 
  handleSaveService, 
  handleDeleteService, 
  toggleServiceStatus,
  loading 
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Manage Services</h2>
        <button
          onClick={() => setEditingService('new')}
          className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center space-x-2"
        >
          <span>+</span>
          <span>Add New Service</span>
        </button>
      </div>

      {/* Service Form */}
      {(editingService || editingService === 'new') && (
        <ServiceForm
          service={editingService === 'new' ? newService : editingService}
          onChange={editingService === 'new' ? setNewService : setEditingService}
          onSave={handleSaveService}
          onCancel={() => setEditingService(null)}
          isNew={editingService === 'new'}
          loading={loading}
        />
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(service => (
          <div key={service.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-lg text-gray-900">{service.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                service.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {service.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.description}</p>
            
            <div className="flex justify-between items-center mb-4">
              <span className="text-pink-600 font-bold text-lg">R{service.base_price}</span>
              <span className="text-gray-500 text-sm">{service.duration_minutes} mins</span>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setEditingService(service)}
                className="flex-1 bg-gray-600 text-white py-2 rounded hover:bg-gray-700 transition-colors text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => toggleServiceStatus(service.id)}
                className={`flex-1 py-2 rounded transition-colors text-sm ${
                  service.is_active 
                    ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {service.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => handleDeleteService(service.id)}
                className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💄</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No services yet</h3>
          <p className="text-gray-500 mb-4">Get started by adding your first service</p>
          <button
            onClick={() => setEditingService('new')}
            className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors"
          >
            Add Your First Service
          </button>
        </div>
      )}
    </div>
  );
};

const ServiceForm = ({ service, onChange, onSave, onCancel, isNew, loading }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(e);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">{isNew ? 'Add New Service' : 'Edit Service'}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Service Name *</label>
          <input
            type="text"
            value={service.name}
            onChange={(e) => onChange({...service, name: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <select
            value={service.category}
            onChange={(e) => onChange({...service, category: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            required
            disabled={loading}
          >
            <option value="makeup">Makeup</option>
            <option value="hair">Hair</option>
            <option value="package">Package</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price (R) *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={service.base_price}
            onChange={(e) => onChange({...service, base_price: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) *</label>
          <input
            type="number"
            min="1"
            value={service.duration_minutes}
            onChange={(e) => onChange({...service, duration_minutes: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea
          value={service.description}
          onChange={(e) => onChange({...service, description: e.target.value})}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
          required
          disabled={loading}
        />
      </div>

      <div className="flex items-center space-x-4 mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={service.allow_quantity}
            onChange={(e) => onChange({...service, allow_quantity: e.target.checked})}
            className="mr-2"
            disabled={loading}
          />
          Allow quantity selection
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={service.is_active}
            onChange={(e) => onChange({...service, is_active: e.target.checked})}
            className="mr-2"
            disabled={loading}
          />
          Active service
        </label>
      </div>

      <div className="flex space-x-3">
        <button 
          type="submit" 
          className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          disabled={loading}
        >
          {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
          <span>{loading ? 'Saving...' : 'Save Service'}</span>
        </button>
        <button 
          type="button" 
          onClick={onCancel}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

const AppointmentsTab = ({ appointments }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Appointments</h2>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">All Appointments</h3>
        </div>
        
        <div className="p-6">
          {appointments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map(appointment => (
                    <tr key={appointment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{appointment.customer_name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{appointment.customer_email || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {appointment.service_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(appointment.appointment_date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        R{appointment.total_price || '0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments yet</h3>
              <p className="text-gray-500">Appointments will appear here once customers start booking</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PromotionsTab = () => {
  const [promotions, setPromotions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newPromotion, setNewPromotion] = useState({
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    valid_until: '',
    is_active: true
  });

  const handleAddPromotion = (e) => {
    e.preventDefault();
    const promotion = {
      ...newPromotion,
      id: Date.now(),
      created_at: new Date().toISOString()
    };
    setPromotions(prev => [...prev, promotion]);
    setNewPromotion({
      name: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      valid_until: '',
      is_active: true
    });
    setShowForm(false);
    alert('Promotion added successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Promotions & Discounts</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
        >
          Add Promotion
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Add New Promotion</h3>
          <form onSubmit={handleAddPromotion} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Promotion Name"
                value={newPromotion.name}
                onChange={(e) => setNewPromotion({...newPromotion, name: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md"
                required
              />
              <select
                value={newPromotion.discount_type}
                onChange={(e) => setNewPromotion({...newPromotion, discount_type: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
              <input
                type="number"
                placeholder="Discount Value"
                value={newPromotion.discount_value}
                onChange={(e) => setNewPromotion({...newPromotion, discount_value: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md"
                required
              />
              <input
                type="date"
                placeholder="Valid Until"
                value={newPromotion.valid_until}
                onChange={(e) => setNewPromotion({...newPromotion, valid_until: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <textarea
              placeholder="Promotion Description"
              value={newPromotion.description}
              onChange={(e) => setNewPromotion({...newPromotion, description: e.target.value})}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <div className="flex space-x-3">
              <button type="submit" className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700">
                Save Promotion
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.map(promotion => (
          <div key={promotion.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-lg mb-2">{promotion.name}</h3>
            <p className="text-gray-600 text-sm mb-3">{promotion.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-green-600 font-bold">
                {promotion.discount_type === 'percentage' ? `${promotion.discount_value}%` : `R${promotion.discount_value}`}
              </span>
              <span className="text-sm text-gray-500">
                Until {new Date(promotion.valid_until).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {promotions.length === 0 && !showForm && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No promotions yet</h3>
          <p className="text-gray-500 mb-4">Create promotions to attract more customers</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors"
          >
            Create Your First Promotion
          </button>
        </div>
      )}
    </div>
  );
};

const SettingsTab = ({ user }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Admin Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <p className="mt-1 text-sm text-gray-900">{user.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-sm text-gray-900">{user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <p className="mt-1 text-sm text-gray-900 capitalize">{user.role}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Business Information</h3>
        <p className="text-gray-600">Business settings and configuration will be available here.</p>
      </div>
    </div>
  );
};

// Sample data functions
const getSampleServices = () => [
  {
    id: 1,
    name: 'Basic Makeup',
    description: 'Natural everyday makeup look perfect for work or casual outings',
    base_price: 350,
    duration_minutes: 60,
    allow_quantity: true,
    is_active: true,
    category: 'makeup',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 2,
    name: 'Glam Makeup',
    description: 'Full glam makeup for special occasions, events, and photoshoots',
    base_price: 600,
    duration_minutes: 90,
    allow_quantity: true,
    is_active: true,
    category: 'makeup',
    created_at: '2024-01-15T10:00:00Z'
  }
];

const getSampleAppointments = () => [
  {
    id: 1,
    customer_name: 'Sarah Johnson',
    customer_email: 'sarah@example.com',
    service_name: 'Bridal Makeup',
    appointment_date: '2024-01-20T10:00:00Z',
    status: 'confirmed',
    total_price: 1200
  },
  {
    id: 2,
    customer_name: 'Mike Wilson',
    customer_email: 'mike@example.com',
    service_name: 'Glam Makeup',
    appointment_date: '2024-01-22T14:00:00Z',
    status: 'pending',
    total_price: 600
  }
];

export default AdminDashboard;