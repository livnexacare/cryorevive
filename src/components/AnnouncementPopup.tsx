import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  body: string
  type: 'general' | 'offer' | 'feature' | 'event'
  image_url?: string | null
  cta_label?: string | null
  cta_url?: string | null
  cta_type?: string | null
}

const TYPE_STYLES = {
  offer:   { badge: 'bg-amber-500',  border: 'border-amber-500/40',  glow: 'shadow-amber-500/20'  },
  feature: { badge: 'bg-cyan-500',   border: 'border-cyan-500/40',   glow: 'shadow-cyan-500/20'   },
  event:   { badge: 'bg-purple-500', border: 'border-purple-500/40', glow: 'shadow-purple-500/20' },
  general: { badge: 'bg-gray-500',   border: 'border-gray-500/40',   glow: 'shadow-gray-500/20'   },
}

const TYPE_LABELS = {
  offer: '🎁 Special Offer',
  feature: '✨ New Feature',
  event: '📅 Event',
  general: '📢 Announcement',
}

export default function AnnouncementPopup() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [current, setCurrent] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      const dismissed = JSON.parse(
        localStorage.getItem('dismissed-announcements') || '[]'
      )

      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/announcements`)
        .then(r => r.json())
        .then((data: Announcement[]) => {
          const unseen = data.filter(a => !dismissed.includes(a.id))
          if (unseen.length > 0) {
            setAnnouncements(unseen)
            setVisible(true)
          }
        })
        .catch(() => {})
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    const ann = announcements[current]
    const dismissed = JSON.parse(
      localStorage.getItem('dismissed-announcements') || '[]'
    )
    localStorage.setItem(
      'dismissed-announcements',
      JSON.stringify([...dismissed, ann.id])
    )

    if (current < announcements.length - 1) {
      setCurrent(prev => prev + 1)
    } else {
      setVisible(false)
    }
  }

  const handleNext = () => {
    if (current < announcements.length - 1) {
      setCurrent(prev => prev + 1)
    } else {
      setVisible(false)
    }
  }

  if (!visible || announcements.length === 0) return null

  const ann = announcements[current]
  const style = TYPE_STYLES[ann.type] || TYPE_STYLES.general

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Popup */}
      <div className={`
        fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        w-[calc(100%-32px)] max-w-md
        bg-gray-900 border ${style.border} rounded-2xl
        shadow-2xl ${style.glow}
        overflow-hidden
        animate-popup
      `}>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 z-10 text-gray-500 hover:text-white transition-colors p-1"
        >
          <X size={20} />
        </button>

        {/* Hero image */}
        {ann.image_url && (
          <div className="w-full overflow-hidden rounded-t-2xl">
            <img
              src={ann.image_url}
              alt={ann.title}
              className="w-full object-cover"
              style={{ maxHeight: '280px', minHeight: '160px' }}
              onError={(e) => {
                (e.target as HTMLImageElement).parentElement!.style.display = 'none'
              }}
            />
          </div>
        )}

        {/* Type badge */}
        <div className={`px-6 pb-0 ${ann.image_url ? 'pt-4' : 'pt-6'}`}>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white ${style.badge}`}>
            {TYPE_LABELS[ann.type]}
          </span>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <h2 className="text-white text-xl font-bold mt-2 mb-3">
            {ann.title}
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            {ann.body}
          </p>
        </div>

        {/* Pagination dots */}
        {announcements.length > 1 && (
          <div className="flex justify-center gap-1.5 pb-2">
            {announcements.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === current ? 'bg-cyan-400' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="px-6 pb-6 flex flex-col gap-3">
          {/* CTA button */}
          {ann.cta_label && ann.cta_url && (
            <a
              href={ann.cta_url}
              target={ann.cta_type === 'phone' ? '_self' : '_blank'}
              rel="noopener noreferrer"
              onClick={handleDismiss}
              className="w-full py-3 text-sm text-white font-bold
                         bg-gradient-to-r from-cyan-600 to-cyan-500
                         hover:from-cyan-500 hover:to-cyan-400
                         rounded-xl transition-all text-center block
                         shadow-lg shadow-cyan-500/20"
            >
              {ann.cta_type === 'whatsapp' && '💬 '}
              {ann.cta_type === 'booking' && '📅 '}
              {ann.cta_type === 'phone' && '📞 '}
              {ann.cta_label}
            </a>
          )}

          {/* Dismiss / Next */}
          {announcements.length > 1 && current < announcements.length - 1 ? (
            <div className="flex gap-3">
              <button
                onClick={handleDismiss}
                className="flex-1 py-2.5 text-sm text-gray-400 border border-gray-700 rounded-xl hover:border-gray-500 transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-2.5 text-sm text-white font-medium bg-cyan-600 hover:bg-cyan-500 rounded-xl transition-colors"
              >
                Next →
              </button>
            </div>
          ) : (
            <button
              onClick={handleDismiss}
              className="w-full py-2.5 text-sm text-white font-medium bg-cyan-600 hover:bg-cyan-500 rounded-xl transition-colors"
            >
              Got it!
            </button>
          )}
        </div>
      </div>
    </>
  )
}
