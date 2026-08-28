import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Star, Phone, User, AlertCircle, Check, X, Shield } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import api from '@/lib/api';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface EmergencyContact {
  id: string;
  full_name: string;
  phone: string;
  relationship: string;
  is_primary: boolean;
  created_at: string;
  updated_at?: string;
}

interface ContactFormData {
  full_name: string;
  phone: string;
  relationship: string;
  is_primary: boolean;
}

export default function EmergencyContactsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [contacts, setContacts] = React.useState<EmergencyContact[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [isAddingContact, setIsAddingContact] = React.useState(false);
  const [editingContact, setEditingContact] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState<ContactFormData>({
    full_name: '',
    phone: '',
    relationship: '',
    is_primary: false,
  });

  React.useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/v1/patient/emergency-contacts/');
      setContacts(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load emergency contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    try {
      setError(null);
      setSuccess(null);

      // Validation
      if (!formData.full_name || !formData.phone || !formData.relationship) {
        setError('Please fill in all required fields');
        return;
      }

      const response = await api.post('/api/v1/patient/emergency-contacts/', formData);
      setContacts([response.data, ...contacts]);
      setSuccess('Emergency contact added successfully');
      setIsAddingContact(false);
      setFormData({ full_name: '', phone: '', relationship: '', is_primary: false });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add emergency contact');
    }
  };

  const handleUpdateContact = async (contactId: string) => {
    try {
      setError(null);
      setSuccess(null);

      const response = await api.put(`/api/v1/patient/emergency-contacts/${contactId}`, formData);
      setContacts(contacts.map(c => c.id === contactId ? response.data : c));
      setSuccess('Emergency contact updated successfully');
      setEditingContact(null);
      setFormData({ full_name: '', phone: '', relationship: '', is_primary: false });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update emergency contact');
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to remove this emergency contact?')) return;

    try {
      setError(null);
      await api.delete(`/api/v1/patient/emergency-contacts/${contactId}`);
      setContacts(contacts.filter(c => c.id !== contactId));
      setSuccess('Emergency contact removed successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to remove emergency contact');
    }
  };

  const handleSetPrimary = async (contactId: string) => {
    try {
      setError(null);
      await api.post(`/api/v1/patient/emergency-contacts/${contactId}/set-primary`);
      setContacts(contacts.map(c => ({ ...c, is_primary: c.id === contactId })));
      setSuccess('Primary emergency contact updated');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to set primary contact');
    }
  };

  const startEditing = (contact: EmergencyContact) => {
    setEditingContact(contact.id);
    setFormData({
      full_name: contact.full_name,
      phone: contact.phone,
      relationship: contact.relationship,
      is_primary: contact.is_primary,
    });
  };

  const cancelEditing = () => {
    setEditingContact(null);
    setIsAddingContact(false);
    setFormData({ full_name: '', phone: '', relationship: '', is_primary: false });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t('common.loading', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('patient.emergency_contacts.title', 'Emergency Contacts')}
              </h1>
              <p className="text-gray-600">
                {t('patient.emergency_contacts.subtitle', 'Manage contacts notified during emergency situations')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Success/Error Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4"
            >
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4"
            >
              <Alert className="border-green-500 bg-green-50">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HIPAA Compliance Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <Alert className="border-blue-200 bg-blue-50">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>Privacy Notice:</strong> Emergency contacts will be notified only when you activate the SOS button.
              Contact information is encrypted and HIPAA-compliant.
            </AlertDescription>
          </Alert>
        </motion.div>

        {/* Add Contact Button */}
        {!isAddingContact && !editingContact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <Button
              onClick={() => setIsAddingContact(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('patient.emergency_contacts.add_contact', 'Add Emergency Contact')}
            </Button>
          </motion.div>
        )}

        {/* Add/Edit Contact Form */}
        <AnimatePresence>
          {(isAddingContact || editingContact) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-6"
            >
              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {editingContact ? (
                      <>
                        <Edit2 className="w-5 h-5 text-blue-600" />
                        {t('patient.emergency_contacts.edit_contact', 'Edit Emergency Contact')}
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5 text-blue-600" />
                        {t('patient.emergency_contacts.new_contact', 'New Emergency Contact')}
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Enter full name"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1234567890"
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +91 for India)</p>
                    </div>

                    <div>
                      <Label htmlFor="relationship">Relationship *</Label>
                      <Input
                        id="relationship"
                        value={formData.relationship}
                        onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                        placeholder="e.g., Spouse, Parent, Sibling, Friend"
                        className="mt-1"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_primary"
                        checked={formData.is_primary}
                        onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <Label htmlFor="is_primary" className="cursor-pointer">
                        Set as primary emergency contact
                      </Label>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={() => editingContact ? handleUpdateContact(editingContact) : handleAddContact()}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        {editingContact ? 'Update Contact' : 'Add Contact'}
                      </Button>
                      <Button
                        onClick={cancelEditing}
                        variant="outline"
                        className="flex-1"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contacts List */}
        <div className="space-y-4">
          <AnimatePresence>
            {contacts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {t('patient.emergency_contacts.no_contacts', 'No Emergency Contacts Yet')}
                </h3>
                <p className="text-gray-600 mb-6">
                  {t('patient.emergency_contacts.no_contacts_description', 'Add trusted contacts who should be notified in emergencies')}
                </p>
              </motion.div>
            ) : (
              contacts.map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`hover:shadow-lg transition-all ${contact.is_primary ? 'border-2 border-yellow-400 bg-yellow-50/30' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                              contact.is_primary ? 'bg-gradient-to-br from-yellow-500 to-orange-500' : 'bg-gradient-to-br from-blue-500 to-indigo-500'
                            }`}>
                              {contact.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                {contact.full_name}
                                {contact.is_primary && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                    Primary
                                  </span>
                                )}
                              </h3>
                              <p className="text-sm text-gray-600">{contact.relationship}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-gray-700 bg-gray-50 px-3 py-2 rounded-lg w-fit">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span className="font-mono text-sm">{contact.phone}</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          {!contact.is_primary && (
                            <Button
                              onClick={() => handleSetPrimary(contact.id)}
                              variant="outline"
                              size="sm"
                              className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                            >
                              <Star className="w-4 h-4 mr-1" />
                              Set Primary
                            </Button>
                          )}
                          <Button
                            onClick={() => startEditing(contact)}
                            variant="outline"
                            size="sm"
                            className="text-blue-600 border-blue-300 hover:bg-blue-50"
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDeleteContact(contact.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          Added on {new Date(contact.created_at).toLocaleDateString()}
                          {contact.updated_at && ` • Last updated ${new Date(contact.updated_at).toLocaleDateString()}`}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8"
        >
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                <AlertCircle className="w-5 h-5" />
                How Emergency Contacts Work
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-indigo-800 space-y-2">
              <p>• <strong>SOS Button:</strong> Press the red SOS button on your dashboard to send emergency alerts</p>
              <p>• <strong>SMS Notification:</strong> All emergency contacts receive instant SMS with your location</p>
              <p>• <strong>Primary Contact:</strong> Your primary contact is notified first</p>
              <p>• <strong>Privacy:</strong> Contacts are only notified when YOU activate SOS (not automatic)</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
