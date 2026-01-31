import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Calendar, 
  Clock, 
  Video, 
  Save, 
  Plus, 
  X, 
  ExternalLink,
  Info,
  CheckCircle
} from 'lucide-react'
import api from '../lib/axios'
import toast from 'react-hot-toast'

const DAYS = [
  { id: 0, name: 'Sunday', short: 'Sun' },
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
]

const DEFAULT_SETTINGS = {
  googleMeetLink: 'https://meet.google.com/abc-defg-hij',
  weekdaySlots: ['8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'],
  saturdaySlots: ['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'],
  sundaySlots: [],
  disabledDays: [0], // Sunday disabled by default
}

export default function DemoSettings() {
  const queryClient = useQueryClient()
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [newSlot, setNewSlot] = useState({ day: 'weekday', time: '' })
  const [hasChanges, setHasChanges] = useState(false)

  // Fetch settings
  const { data, isLoading } = useQuery({
    queryKey: ['demo-settings'],
    queryFn: async () => {
      const res = await api.get('/admin/demo-settings')
      return res.data.data
    },
  })

  useEffect(() => {
    if (data) {
      setSettings(data)
    }
  }, [data])

  // Save settings
  const saveMutation = useMutation({
    mutationFn: async (newSettings) => {
      const res = await api.put('/admin/demo-settings', newSettings)
      return res.data
    },
    onSuccess: () => {
      toast.success('Settings saved!')
      setHasChanges(false)
      queryClient.invalidateQueries(['demo-settings'])
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Failed to save')
    },
  })

  const handleSave = () => {
    saveMutation.mutate(settings)
  }

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const addSlot = (type) => {
    if (!newSlot.time) return
    const key = type === 'weekday' ? 'weekdaySlots' : type === 'saturday' ? 'saturdaySlots' : 'sundaySlots'
    if (!settings[key].includes(newSlot.time)) {
      updateSetting(key, [...settings[key], newSlot.time].sort((a, b) => {
        const timeA = new Date(`1970/01/01 ${a}`)
        const timeB = new Date(`1970/01/01 ${b}`)
        return timeA - timeB
      }))
    }
    setNewSlot({ ...newSlot, time: '' })
  }

  const removeSlot = (type, slot) => {
    const key = type === 'weekday' ? 'weekdaySlots' : type === 'saturday' ? 'saturdaySlots' : 'sundaySlots'
    updateSetting(key, settings[key].filter(s => s !== slot))
  }

  const toggleDay = (dayId) => {
    if (settings.disabledDays.includes(dayId)) {
      updateSetting('disabledDays', settings.disabledDays.filter(d => d !== dayId))
    } else {
      updateSetting('disabledDays', [...settings.disabledDays, dayId])
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Demo Settings</h1>
          <p className="text-surface-500 mt-1">Configure demo booking slots and meeting link</p>
        </div>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saveMutation.isPending}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {saveMutation.isPending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </button>
      </div>

      {/* Google Meet Link */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <Video className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-surface-900">Google Meet Link</h2>
            <p className="text-sm text-surface-500 mt-1">This link will be sent in demo confirmation emails</p>
            
            <div className="mt-4 flex gap-3">
              <input
                type="url"
                value={settings.googleMeetLink}
                onChange={(e) => updateSetting('googleMeetLink', e.target.value)}
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                className="input flex-1"
              />
              <a
                href={settings.googleMeetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Test
              </a>
            </div>

            {/* How to create Google Meet */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">How to create a Google Meet link:</p>
                  <ol className="mt-2 text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Go to <a href="https://meet.google.com" target="_blank" rel="noopener noreferrer" className="underline">meet.google.com</a></li>
                    <li>Click "New meeting" → "Create a meeting for later"</li>
                    <li>Copy the link and paste it above</li>
                  </ol>
                  <p className="mt-2 text-blue-600">💡 Tip: Use the same link for all demos, or create unique links via Google Calendar</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Days */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-surface-900">Available Days</h2>
            <p className="text-sm text-surface-500 mt-1">Select which days are available for demo bookings</p>
            
            <div className="mt-4 flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  key={day.id}
                  onClick={() => toggleDay(day.id)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    settings.disabledDays.includes(day.id)
                      ? 'bg-surface-100 text-surface-400 line-through'
                      : 'bg-primary-100 text-primary-700'
                  }`}
                >
                  {day.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Time Slots */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <Clock className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-surface-900">Time Slots</h2>
            <p className="text-sm text-surface-500 mt-1">Configure available time slots for each day type</p>
            
            {/* Weekday Slots */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-surface-700 mb-3">Weekday Slots (Mon-Fri)</h3>
              <div className="flex flex-wrap gap-2">
                {settings.weekdaySlots.map((slot) => (
                  <span
                    key={slot}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface-100 rounded-lg text-sm"
                  >
                    {slot}
                    <button
                      onClick={() => removeSlot('weekday', slot)}
                      className="text-surface-400 hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 7:00 PM"
                    value={newSlot.day === 'weekday' ? newSlot.time : ''}
                    onChange={(e) => setNewSlot({ day: 'weekday', time: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && addSlot('weekday')}
                    className="w-28 px-3 py-1.5 text-sm border border-surface-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                  />
                  <button
                    onClick={() => addSlot('weekday')}
                    className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Saturday Slots */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-surface-700 mb-3">Saturday Slots</h3>
              <div className="flex flex-wrap gap-2">
                {settings.saturdaySlots.map((slot) => (
                  <span
                    key={slot}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface-100 rounded-lg text-sm"
                  >
                    {slot}
                    <button
                      onClick={() => removeSlot('saturday', slot)}
                      className="text-surface-400 hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 2:00 PM"
                    value={newSlot.day === 'saturday' ? newSlot.time : ''}
                    onChange={(e) => setNewSlot({ day: 'saturday', time: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && addSlot('saturday')}
                    className="w-28 px-3 py-1.5 text-sm border border-surface-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                  />
                  <button
                    onClick={() => addSlot('saturday')}
                    className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Sunday Slots */}
            {!settings.disabledDays.includes(0) && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-surface-700 mb-3">Sunday Slots</h3>
                <div className="flex flex-wrap gap-2">
                  {settings.sundaySlots.map((slot) => (
                    <span
                      key={slot}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface-100 rounded-lg text-sm"
                    >
                      {slot}
                      <button
                        onClick={() => removeSlot('sunday', slot)}
                        className="text-surface-400 hover:text-red-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 11:00 AM"
                      value={newSlot.day === 'sunday' ? newSlot.time : ''}
                      onChange={(e) => setNewSlot({ day: 'sunday', time: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && addSlot('sunday')}
                      className="w-28 px-3 py-1.5 text-sm border border-surface-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                    />
                    <button
                      onClick={() => addSlot('sunday')}
                      className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="card p-6 bg-surface-50">
        <h2 className="font-semibold text-surface-900 mb-4">Preview</h2>
        <div className="grid grid-cols-7 gap-2 text-center text-sm">
          {DAYS.map((day) => (
            <div key={day.id}>
              <div className={`font-medium mb-2 ${settings.disabledDays.includes(day.id) ? 'text-surface-300' : 'text-surface-700'}`}>
                {day.short}
              </div>
              {settings.disabledDays.includes(day.id) ? (
                <div className="text-surface-300 text-xs">Closed</div>
              ) : (
                <div className="text-xs text-surface-500">
                  {day.id === 6 ? settings.saturdaySlots.length : day.id === 0 ? settings.sundaySlots.length : settings.weekdaySlots.length} slots
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Save reminder */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 bg-primary-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
          <span>You have unsaved changes</span>
          <button
            onClick={handleSave}
            className="bg-white text-primary-600 px-3 py-1 rounded-lg text-sm font-medium"
          >
            Save Now
          </button>
        </div>
      )}
    </div>
  )
}
