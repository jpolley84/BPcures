import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';

const SuccessPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gradient-navy">
      <div className="max-w-[640px] w-full text-center" style={{ animation: 'fadeInUp 0.8s ease-out' }}>
        <div className="success-checkmark mb-8">
          <div className="w-20 h-20 rounded-full bg-green-400/20 flex items-center justify-center mx-auto">
            <CheckCircle className="text-green-400" size={48} />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-white" style={{ letterSpacing: '-0.03em' }}>
          Thank you for your purchase!
        </h1>

        <div className="bg-white/10 p-6 rounded-2xl mb-10 text-center text-white border border-white/10 backdrop-blur-sm">
          <p className="text-lg text-gray-200">Your order has been processed successfully.</p>
          <p className="text-sm text-gray-400 mt-2">A receipt has been sent to your email.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/downloads"
            className="btn-standard text-white w-full sm:w-auto no-underline font-bold text-[16px] gradient-purple-btn"
          >
            <span className="flex items-center gap-2">View Downloads <ArrowRight size={18} /></span>
          </Link>
          <Link
            to="/"
            className="btn-standard w-full sm:w-auto no-underline font-bold text-[16px]"
            style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;
