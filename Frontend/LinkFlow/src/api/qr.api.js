{activePage === "Analytics" && !loading && !loadError && (
  <Analytics links={links} />
)}

{activePage !== "Analytics" && pageDescriptions[activePage] && (
  <ComingSoonPage
    title={activePage}
    description={pageDescriptions[activePage].description}
    icon={pageDescriptions[activePage].icon}
  />
)}  