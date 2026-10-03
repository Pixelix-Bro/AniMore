import './globals.css'

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={` h-full antialiased`}>
      <body className="min-h-full flex flex-col selection:bg-black selection:text-white">
        {children}
      </body>
    </html>
  )
}
