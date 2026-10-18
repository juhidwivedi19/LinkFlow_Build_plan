import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Command,
  ExternalLink,
  Globe2,
  LayoutDashboard,
  Link2,
  Plus,
  QrCode,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'

const navigation = [
  { label: 'Overview', icon: LayoutDashboard, active: true },
  { label: 'Links', icon: Link2, badge: '128' },
  { label: 'Analytics', icon: BarChart3 },
  { label: 'QR Codes', icon: QrCode },
]

const workspaceNavigation = [
  { label: 'Team members', icon: Users },
  { label: 'Custom domains', icon: Globe2 },
  { label: 'API & Integrations', icon: Command },
]

const metrics = [
  {
    label: 'Total clicks',
    value: '248,392',
    change: '+18.6%',
    positive: true,
    icon: Activity,
    description: 'vs. previous 30 days',
  },
  {
    label: 'Active links',
    value: '128',
    change: '+12',
    positive: true,
    icon: Link2,
    description: 'vs. previous month',
  },
  {
    label: 'Unique visitors',
    value: '86,241',
    change: '+12.4%',
    positive: true,
    icon: Users,
    description: 'vs. previous 30 days',
  },
  {
    label: 'Avg. CTR',
    value: '4.82%',
    change: '-0.8%',
    positive: false,
    icon: Zap,
    description: 'vs. previous 30 days',
  },
]

function SidebarLink({ icon: Icon, label, active, badge }) {
  return (
    <button
      type="button"
      className={`sidebar-link ${active ? 'sidebar-link-active' : ''}`}
    >
      <Icon size={18} strokeWidth={1.8} />
      <span>{label}</span>
      {badge && <span className="sidebar-badge">{badge}</span>}
    </button>
  )
}

function MetricCard({ label, value, change, positive, icon: Icon, description }) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        <span className="metric-icon">
          <Icon size={18} strokeWidth={1.8} />
        </span>
      </div>

      <div className="metric-value">{value}</div>

      <div className="metric-footer">
        <span className={`metric-change ${positive ? 'positive' : 'negative'}`}>
          {positive ? (
            <ArrowUpRight size={15} />
          ) : (
            <ArrowDownRight size={15} />
          )}
          {change}
        </span>
        <span className="metric-description">{description}</span>
      </div>
    </article>
  )
}

function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Link2 size={21} strokeWidth={2.3} />
          </div>
          <span className="brand-name">linkflow</span>
          <span className="brand-version">BETA</span>
        </div>

        <button type="button" className="workspace-switcher">
          <div className="workspace-avatar">L</div>
          <div className="workspace-copy">
            <span className="workspace-name">Launch Studio</span>
            <span className="workspace-plan">Pro workspace</span>
          </div>
          <ChevronDown size={16} className="workspace-chevron" />
        </button>

        <div className="sidebar-section">
          <span className="section-label">WORKSPACE</span>
          <nav className="sidebar-nav" aria-label="Main navigation">
            {navigation.map((item) => (
              <SidebarLink key={item.label} {...item} />
            ))}
          </nav>
        </div>

        <div className="sidebar-section workspace-section">
          <span className="section-label">MANAGE</span>
          <nav className="sidebar-nav" aria-label="Workspace management">
            {workspaceNavigation.map((item) => (
              <SidebarLink key={item.label} {...item} />
            ))}
          </nav>
        </div>

        <div className="sidebar-spacer" />

        <div className="upgrade-card">
          <div className="upgrade-icon">
            <Sparkles size={17} />
          </div>
          <h3>Unlock more insights</h3>
          <p>Get deeper analytics and grow your audience faster.</p>
          <button type="button" className="upgrade-button">
            Explore Pro <ArrowUpRight size={15} />
          </button>
        </div>

        <div className="sidebar-bottom">
          <button type="button" className="sidebar-link">
            <CircleHelp size={18} />
            <span>Help & support</span>
          </button>
          <button type="button" className="sidebar-link">
            <Settings2 size={18} />
            <span>Settings</span>
          </button>

          <div className="profile-row">
            <div className="profile-avatar">JD</div>
            <div className="profile-copy">
              <span className="profile-name">Juhi Dwivedi</span>
              <span className="profile-email">juhi@example.com</span>
            </div>
            <ChevronDown size={15} className="profile-chevron" />
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <ChevronRight size={15} />
            <span className="breadcrumb-current">Overview</span>
          </div>

          <div className="topbar-actions">
            <label className="search-box">
              <Search size={16} />
              <input aria-label="Search" placeholder="Search anything..." />
              <kbd>⌘ K</kbd>
            </label>

            <button type="button" className="icon-button" aria-label="Notifications">
              <Bell size={18} />
              <span className="notification-dot" />
            </button>

            <button type="button" className="help-button">
              <CircleHelp size={17} />
              <span>Help</span>
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="status-dot" />
                YOUR WORKSPACE AT A GLANCE
              </div>
              <h1>Good morning, Juhi <span>✳</span></h1>
              <p>Here&apos;s what&apos;s happening with your links today.</p>
            </div>

            <button type="button" className="primary-button">
              <Plus size={18} strokeWidth={2.2} />
              Create new link
            </button>
          </section>

          <section className="metrics-grid" aria-label="Performance metrics">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </section>

          <section className="analytics-section">
            <div className="section-heading-row">
              <div>
                <h2>Performance overview</h2>
                <p>Understand how your audience engages with your links.</p>
              </div>

              <button type="button" className="date-filter">
                Last 30 days
                <ChevronDown size={15} />
              </button>
            </div>

            <div className="analytics-placeholder">
              <div className="placeholder-icon">
                <BarChart3 size={24} />
              </div>
              <h3>Your performance, visualized.</h3>
              <p>
                Your interactive click analytics chart will appear here.
                We&apos;ll connect it to your real analytics API next.
              </p>
            </div>
          </section>

          <section className="bottom-grid">
            <article className="content-card">
              <div className="section-heading-row compact-heading">
                <div>
                  <h2>Top performing links</h2>
                  <p>Your most engaging content this month.</p>
                </div>
                <button type="button" className="text-button">
                  View all <ArrowUpRight size={15} />
                </button>
              </div>

              <div className="empty-state">
                <div className="empty-state-icon">
                  <Link2 size={21} />
                </div>
                <h3>Your best links will show up here</h3>
                <p>Create a short link to start tracking performance.</p>
              </div>
            </article>

            <article className="content-card activity-card">
              <div className="section-heading-row compact-heading">
                <div>
                  <h2>Recent activity</h2>
                  <p>Stay up to date with your workspace.</p>
                </div>
                <Activity size={17} className="muted-icon" />
              </div>

              <div className="empty-state">
                <div className="empty-state-icon">
                  <ShieldCheck size={21} />
                </div>
                <h3>All caught up</h3>
                <p>New workspace activity will appear here.</p>
              </div>
            </article>
          </section>

          <footer className="dashboard-footer">
            <span>LinkFlow <span className="footer-separator">·</span> Built for your next big thing.</span>
            <span className="footer-status">
              <span className="status-dot" />
              All systems operational
              <ExternalLink size={12} />
            </span>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App