import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Input, Button, App } from 'antd';
import { MailOutlined, LockOutlined, ReloadOutlined, CarOutlined, FireOutlined, SettingOutlined, EllipsisOutlined } from '@ant-design/icons';
import loginImage from '../../assets/images/loginHero.jpg';
import ibimaLogo from '../../assets/images/ibimaLogo.svg';
import { COLORS } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { login, getSession } from '../../auth/session';

const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
const generateCaptcha = (length = 5) =>
    Array.from({ length }, () => CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)]).join('');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^(\+91[\s-]?)?[6-9]\d{9}$/;

const CowIcon = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 5c-1.5 0-3 1-3 2.5S3.5 9 5 9M19 5c1.5 0 3 1 3 2.5S20.5 9 19 9" />
        <path d="M7 6.5C7 5 9 4 12 4s5 1 5 2.5V13c0 1-.4 1.8-1 2.4V17a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3v-1.6c-.6-.6-1-1.4-1-2.4z" />
        <circle cx="10.5" cy="17" r=".6" fill="currentColor" />
        <circle cx="13.5" cy="17" r=".6" fill="currentColor" />
        <circle cx="9.5" cy="10" r=".8" fill="currentColor" />
        <circle cx="14.5" cy="10" r=".8" fill="currentColor" />
    </svg>
);

const ShipIcon = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v4M8 7h8l1 5H7z" />
        <path d="M3 13h18l-2.5 5.5a2 2 0 0 1-1.8 1.2H7.3a2 2 0 0 1-1.8-1.2z" />
        <path d="M2 21.5c1.5 0 1.5-.8 3-.8s1.5.8 3 .8 1.5-.8 3-.8 1.5.8 3 .8 1.5-.8 3-.8 1.5.8 3 .8" />
    </svg>
);

const HERO_RATIO = 876 / 1117; // loginHero.jpg natural width / height

// Bottom-of-hero insurance lines (shield badges, as in the reference design).
const INSURANCE_LINES = [
    { label: 'Motor', icon: <CarOutlined />, from: '#2F5BEA', to: '#0B2E9E' },
    { label: 'Cattle', icon: <CowIcon />, from: '#34A853', to: '#12702F' },
    { label: 'Fire', icon: <FireOutlined />, from: '#9B5CF0', to: '#5B21B6' },
    { label: 'Marine', icon: <ShipIcon />, from: '#FDB022', to: '#E27A06' },
    { label: 'Engineering', icon: <SettingOutlined />, from: '#1BA8C4', to: '#0B6E8A' },
    { label: 'Others', icon: <EllipsisOutlined />, from: '#5A5FF0', to: '#2E2FA8' },
];

const ShieldBadge = ({ icon, from, to, id }) => (
    <div className="relative drop-shadow-md" style={{ width: '9cqw', height: '10.3cqw' }}>
        <svg viewBox="0 0 56 64" className="absolute inset-0 w-full h-full" aria-hidden="true">
            <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={from} />
                    <stop offset="1" stopColor={to} />
                </linearGradient>
            </defs>
            <path d="M28 1.5 53 10v20c0 16-11 27-25 32.5C14 57 3 46 3 30V10z" fill={`url(#${id})`} stroke="#fff" strokeOpacity=".55" strokeWidth="1.5" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-white" style={{ fontSize: '4cqw', paddingBottom: '0.8cqw' }}>{icon}</span>
    </div>
);

const Label = ({ children, extra }) => (
    <div className="flex items-center justify-between mb-1">
        <label className="text-[12px] font-semibold" style={{ color: COLORS.textPrimary }}>
            {children} <span style={{ color: COLORS.danger }}>*</span>
        </label>
        {extra}
    </div>
);

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { message } = App.useApp();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [captcha, setCaptcha] = useState(() => generateCaptcha());
    const [captchaInput, setCaptchaInput] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const refreshCaptcha = () => {
        setCaptcha(generateCaptcha());
        setCaptchaInput('');
    };

    // Already signed in -> straight to the dashboard. Bounced here by an expired session -> say so.
    useEffect(() => {
        if (getSession()) navigate(ROUTES.DASHBOARD, { replace: true });
        else if (new URLSearchParams(location.search).get('expired')) setError('Your session has ended. Please sign in again.');
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSubmit = async (e) => {
        e.preventDefault();
        const id = identifier.trim();
        if (!id) return setError('Please enter your email address or mobile number.');
        if (!EMAIL_RE.test(id) && !MOBILE_RE.test(id.replace(/\s/g, ''))) return setError('Enter a valid email address or 10-digit mobile number.');
        if (!password) return setError('Please enter your password.');
        if (captchaInput.trim() !== captcha) {
            setError('Captcha does not match (it is case-sensitive).');
            refreshCaptcha();
            return;
        }
        setError('');
        setLoading(true);
        try {
            const session = await login(id, password);
            message.success(`Welcome, ${session.name}`);
            navigate(location.state?.from ?? ROUTES.DASHBOARD, { replace: true });
        } catch (err) {
            setError(err.message);
            refreshCaptcha();
            setPassword('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex bg-white overflow-hidden">
            {/* Hero behaves like object-cover/object-top, but the wrapper keeps the
                image's own aspect ratio (headline never gets clipped). The shield row is
                pinned to the panel bottom and sized off the panel width (cqw). */}
            <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-white" style={{ containerType: 'size' }}>
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2"
                    style={{ width: `max(100cqw, calc(100cqh * ${HERO_RATIO}))`, aspectRatio: HERO_RATIO }}
                >
                    <img src={loginImage} alt="Smarter Claims. Stronger Protection." className="absolute inset-0 w-full h-full" />
                </div>
                <div className="absolute inset-x-0 bottom-0" style={{ padding: '6cqw 0 3.5cqw', background: 'linear-gradient(to bottom, rgba(248,251,254,0) 0%, rgba(248,251,254,.75) 45%, rgba(248,251,254,.9) 100%)' }}>
                    <ul className="grid grid-cols-6 w-full list-none m-0" style={{ padding: '0 7.5cqw' }}>
                        {INSURANCE_LINES.map((l) => (
                            <li key={l.label} className="flex flex-col items-center text-center">
                                <ShieldBadge id={`shield-${l.label}`} icon={l.icon} from={l.from} to={l.to} />
                                <span className="font-semibold" style={{ marginTop: '1.2cqw', fontSize: '2.25cqw', lineHeight: 1.45, color: COLORS.textPrimary }}>
                                    {l.label}<br />Insurance
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="w-full lg:w-1/2 flex items-center justify-center px-5 py-4 overflow-y-auto">
                <div className="w-full max-w-[380px]">
                    {/* Twin-logo lockup */}
                    <div className="flex justify-center mb-4">
                        <div className="inline-flex rounded-md overflow-hidden" style={{ border: '2px solid #1E2A5A' }}>
                            <img src={ibimaLogo} alt="IBima Assist" className="block" style={{ height: 44, borderRight: '2px solid #1E2A5A' }} />
                            <img src={ibimaLogo} alt="" aria-hidden="true" className="block" style={{ height: 44 }} />
                        </div>
                    </div>

                    <h1 className="text-lg font-bold m-0" style={{ color: COLORS.textPrimary }}>Welcome back</h1>
                    <p className="text-[12px] mt-0.5 mb-3" style={{ color: COLORS.textPrimary }}>Sign in to your account to continue.</p>

                    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2.5">
                        <div>
                            <Label>Email Address/ Mobile Number</Label>
                            <Input
                                prefix={<MailOutlined style={{ color: COLORS.textMuted }} />}
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="Enter Email Address"
                                autoComplete="username"
                                variant="filled" style={{ height: 34, border: `1px solid ${COLORS.border}` }}
                            />
                        </div>

                        <div>
                            <Label extra={(
                                <button type="button" className="text-xs" style={{ color: COLORS.textMuted }} onClick={() => message.info('Please contact your IBima Assist administrator to reset your password.')}>
                                    Forgot password?
                                </button>
                            )}
                            >
                                Password
                            </Label>
                            <Input.Password
                                prefix={<LockOutlined style={{ color: COLORS.textMuted }} />}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter Password"
                                autoComplete="current-password"
                                variant="filled" style={{ height: 34, border: `1px solid ${COLORS.border}` }}
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-[12px] select-none" style={{ letterSpacing: '0.55em', fontFamily: 'monospace', color: COLORS.textPrimary }} aria-label={`Captcha ${captcha.split('').join(' ')}`}>
                                {captcha}
                            </span>
                            <button type="button" onClick={refreshCaptcha} aria-label="Refresh captcha" style={{ color: COLORS.primary, fontSize: 14 }}>
                                <ReloadOutlined />
                            </button>
                        </div>
                        <Input value={captchaInput} onChange={(e) => setCaptchaInput(e.target.value)} aria-label="Captcha" variant="filled" style={{ height: 34, border: `1px solid ${COLORS.border}` }} />

                        {error && <p role="alert" className="text-xs m-0" style={{ color: COLORS.danger }}>{error}</p>}

                        <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 34, fontSize: 13, fontWeight: 600, background: '#0B3FC4' }}>Sign In</Button>
                    </form>

                    <div className="mt-4 text-[10px] leading-snug" style={{ color: COLORS.textPrimary }}>
                        <p className="m-0">Powered By Vroomsync Expertise Private Limited. All Rights Reserved 2025. CIN: U62099CT2025PTC017274</p>
                        <p className="m-0">Insurance is the subject matter of solicitation.</p>
                        <p className="mt-1.5 mb-0">Images used on this website and the models photographed in them are for representative purposes only and are not indicative of anyone&apos;s personal thoughts or ideas.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
