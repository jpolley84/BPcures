import { Link } from 'react-router-dom';
import { Download, FileText, ArrowLeft } from 'lucide-react';

const files = [
  { name: 'Master Blood Pressure Document', desc: 'Complete protocol with daily checklists and tracking sheets', file: 'master-bp-document.pdf' },
  { name: 'Top 10 Herbs Deep Dive', desc: 'Dosing, timing, and what to look for on the label', file: 'top-10-herbs.pdf' },
  { name: '10-Day Blood Pressure Reset Challenge', desc: 'Step-by-step daily plan with meal ideas', file: '10-day-reset-challenge.pdf' },
  { name: 'Cook For Life Cookbook', desc: '50+ heart-healthy recipes using common ingredients', file: 'cook-for-life-cookbook.pdf' },
  { name: 'White Coat Syndrome Guide', desc: 'How to get accurate readings at home and at the doctor', file: 'white-coat-syndrome-guide.pdf' },
  { name: 'BONUS: Overmedicated Boomers Book', desc: 'The full book on prescription overload', file: 'overmedicated-boomers.pdf' },
];

const DownloadsPage = () => {
  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-[640px] mx-auto">
        <div className="text-center mb-12" style={{ animation: 'fadeInUp 0.7s ease-out' }}>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: 'var(--navy)', letterSpacing: '-0.03em' }}>
            Your Downloads
          </h1>
          <p style={{ color: 'var(--dark-gray)' }}>
            Access all your purchased digital files below.
          </p>
        </div>

        <div className="space-y-4 mb-12">
          {files.map((file, index) => (
            <div
              key={index}
              className="download-card p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              style={{ animation: `fadeInUp 0.5s ease-out ${index * 80}ms both` }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <FileText style={{ color: 'var(--purple)' }} size={20} />
                </div>
                <div>
                  <h3 className="font-semibold mb-0.5" style={{ color: 'var(--navy)', fontSize: '16px' }}>{file.name}</h3>
                  <p className="text-[13px]" style={{ color: 'var(--muted-gray)' }}>{file.desc}</p>
                </div>
              </div>
              <a
                href={`/downloads/${file.file}`}
                download
                className="flex items-center justify-center gap-2 font-semibold px-5 py-2.5 rounded-xl transition-all w-full sm:w-auto flex-shrink-0 hover:shadow-md active:scale-[0.97] no-underline gradient-purple-btn"
                style={{ color: 'white', fontSize: '14px' }}
              >
                <Download size={16} />
                <span>Download</span>
              </a>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 font-medium hover:underline transition-all no-underline"
            style={{ color: 'var(--muted-gray)' }}
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DownloadsPage;
