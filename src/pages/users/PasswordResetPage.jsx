import React, { useState } from 'react';
import { Input, Button, App, Modal, Typography } from 'antd';
import { LockOutlined, CheckCircleOutlined, CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { COLORS } from '../../constants/theme';
import { useLogChange, useRoles } from '../../store/AdminStore';
import { api } from '../../api/client';

const STEPS = ['Search User By User ID', 'Verify Registered Contact Details', 'Send Secure Reset Link', 'Manual Reset With Audit Trail'];

const FieldLabel = ({ children }) => <label className="block text-[13px] font-semibold mt-2.5 mb-1" style={{ color: COLORS.primary }}>{children}</label>;

const fieldStyle = { height: 34, fontSize: 12.5, background: '#F4F4F4', border: '1px solid #DDDDDD' };

/**
 * Password Reset -- Verify User asks the server to match the User ID with
 * the registered email + contact number; only a verified user can get a
 * reset link or a manual reset (both recorded in the audit trail).
 */
const PasswordResetPage = () => {
    const { message } = App.useApp();
    const roles = useRoles();
    const logChange = useLogChange();

    const [userId, setUserId] = useState('');
    const [email, setEmail] = useState('');
    const [contact, setContact] = useState('');
    const [verified, setVerified] = useState(null);
    const [error, setError] = useState('');
    const [tempPassword, setTempPassword] = useState(null);
    const [resetLink, setResetLink] = useState(null);
    const [busy, setBusy] = useState(null);

    // Any edit after verifying needs a fresh verification.
    const edit = (setter) => (e) => {
        setter(e.target.value);
        setVerified(null);
        setError('');
    };

    const verify = async () => {
        if (!userId.trim()) return setError('Enter the User ID.');
        if (!email.trim() || !contact.trim()) return setError('Enter the registered email address and contact number.');
        setBusy('verify');
        try {
            const user = await api.post('/users/verify', { userId: userId.trim(), email: email.trim(), contact: contact.trim() });
            setError('');
            setVerified(user);
            message.success(`${user.name} verified`);
        } catch (err) {
            setError(err.status === 404 ? `No user found with User ID "${userId.trim()}".` : err.message);
        } finally {
            setBusy(null);
        }
        return undefined;
    };

    const requireVerified = () => {
        if (verified) return true;
        message.warning('Verify the user first.');
        return false;
    };

    const sendLink = async () => {
        if (!requireVerified()) return;
        setBusy('link');
        try {
            const res = await api.post(`/users/${verified.id}/reset-link`);
            logChange('Password Reset', `Reset link · ${verified.userId}`, '—', `Link for ${res.email}`);
            setResetLink(res);
        } catch (err) {
            message.error(err.message);
        } finally {
            setBusy(null);
        }
    };

    const resetManually = async () => {
        if (!requireVerified()) return;
        setBusy('manual');
        try {
            const res = await api.post(`/users/${verified.id}/reset-password`);
            logChange('Password Reset', `Manual reset · ${verified.userId}`, '—', 'Temp password issued');
            setTempPassword(res.tempPassword);
        } catch (err) {
            message.error(err.message);
        } finally {
            setBusy(null);
        }
    };

    const clear = () => {
        setUserId('');
        setEmail('');
        setContact('');
        setVerified(null);
        setTempPassword(null);
        setResetLink(null);
    };

    return (
        <>
            <h1 className="text-[20px] font-bold m-0 mb-3" style={{ color: COLORS.primary }}>Password Reset</h1>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,440px)_1fr] rounded-md overflow-hidden" style={{ border: '1px solid #DDDDDD' }}>
                <div className="relative overflow-hidden p-4 pb-24" style={{ background: '#E6EEF9' }}>
                    <span className="flex items-center justify-center rounded" style={{ width: 56, height: 56, background: '#B4C9F0', color: COLORS.primary, fontSize: 26 }}>
                        <LockOutlined />
                    </span>
                    <h2 className="text-[18px] font-bold mt-6 mb-1.5" style={{ color: COLORS.primary }}>Password Reset</h2>
                    <p className="text-[12.5px] m-0 mb-3">Reset Or Send A Secure Password Reset Link To An IBima Assist User.</p>
                    <ul className="list-none p-0 m-0 flex flex-col gap-2 text-[12.5px]">
                        {STEPS.map((s) => <li key={s} className="flex items-center gap-2"><CheckCircleOutlined /> {s}</li>)}
                    </ul>
                    <span className="absolute rounded-full" style={{ width: 280, height: 280, right: -140, bottom: -140, background: '#7EA2E2' }} />
                </div>

                <div className="p-4 md:p-5 bg-white">
                    <h2 className="text-[18px] font-bold m-0" style={{ color: COLORS.primary }}>Reset User Password</h2>
                    <p className="text-[12.5px] mt-0.5 mb-1">Enter The Registered User Details To Continue.</p>

                    <FieldLabel>User ID</FieldLabel>
                    <Input value={userId} onChange={edit(setUserId)} placeholder="Enter User ID" style={fieldStyle} onPressEnter={verify} />
                    <FieldLabel>Registered Email Address</FieldLabel>
                    <Input value={email} onChange={edit(setEmail)} placeholder="Username@Companyname.Com" style={fieldStyle} onPressEnter={verify} />
                    <FieldLabel>Registered Contact Number</FieldLabel>
                    <Input value={contact} onChange={edit(setContact)} placeholder="+91 1234567890" style={fieldStyle} onPressEnter={verify} />

                    <div className="min-h-[30px] mt-2">
                        {error && <div role="alert" className="flex items-center gap-2 text-[12px]" style={{ color: COLORS.danger }}><CloseCircleFilled /> {error}</div>}
                        {verified && (
                            <div className="flex items-center gap-2 rounded-md px-3 py-1.5 text-[12px]" style={{ background: '#D1EEDD', color: '#1E8E4E' }}>
                                <CheckCircleFilled />
                                Verified: <b>{verified.name}</b> · {roles.byKey[verified.roleKey]?.name ?? verified.roleKey} · {verified.organization} · {verified.status}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 max-w-[560px]">
                        <Button onClick={verify} loading={busy === 'verify'} style={{ height: 34, fontSize: 13, fontWeight: 600, background: COLORS.primarySoft, color: COLORS.primary, border: 'none' }}>Verify User</Button>
                        <Button type="primary" onClick={sendLink} loading={busy === 'link'} style={{ height: 34, fontSize: 13, fontWeight: 600 }}>Send  Link</Button>
                        <Button onClick={resetManually} loading={busy === 'manual'} style={{ height: 34, fontSize: 13, fontWeight: 600, background: COLORS.primarySoft, color: COLORS.primary, border: 'none' }}>Reset Manually</Button>
                    </div>
                </div>
            </div>

            <Modal
                open={!!tempPassword}
                title="Password reset manually"
                onCancel={clear}
                footer={<Button type="primary" onClick={clear}>Done</Button>}
            >
                <p className="text-[12px]">A new temporary password was issued for <b>{verified?.name}</b> ({verified?.userId}). Share it securely — the user must change it at first login.</p>
                <Typography.Paragraph copyable={{ text: tempPassword ?? '' }} className="text-[15px] font-mono font-semibold rounded px-3 py-1.5" style={{ background: COLORS.bgField }}>
                    {tempPassword}
                </Typography.Paragraph>
                <p className="text-[12px] text-slate-500 m-0">Recorded in Recent Configuration Changes (audit trail).</p>
            </Modal>

            <Modal
                open={!!resetLink}
                title="Secure reset link created"
                onCancel={clear}
                footer={<Button type="primary" onClick={clear}>Done</Button>}
            >
                <p className="text-[12px]">
                    One-time link for <b>{verified?.name}</b> ({resetLink?.email}), valid until {resetLink && new Date(resetLink.expiresAt).toLocaleString()}.
                    {resetLink && !resetLink.emailSent && ' No mail server is set up yet, so share this link with the user securely.'}
                </p>
                <Typography.Paragraph copyable={{ text: resetLink?.link ?? '' }} className="text-[12px] font-mono rounded px-3 py-1.5 break-all" style={{ background: COLORS.bgField }}>
                    {resetLink?.link}
                </Typography.Paragraph>
            </Modal>
        </>
    );
};

export default PasswordResetPage;
