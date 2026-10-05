import React, { useState } from 'react';
import { Input, Button, App, Modal, Typography } from 'antd';
import { LockOutlined, CheckCircleOutlined, CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { COLORS } from '../../constants/theme';
import { useCollection, useLogChange, useRoles } from '../../store/AdminStore';
import { generatePassword } from '../../utils/format';

const STEPS = ['Search User By User ID', 'Verify Registered Contact Details', 'Send Secure Reset Link', 'Manual Reset With Audit Trail'];

const normalizePhone = (s = '') => s.replace(/\D/g, '').slice(-10);

const FieldLabel = ({ children }) => <label className="block text-[13px] font-semibold mt-2.5 mb-1" style={{ color: COLORS.primary }}>{children}</label>;

const fieldStyle = { height: 34, fontSize: 12.5, background: '#F4F4F4', border: '1px solid #DDDDDD' };

/**
 * Password Reset -- Verify User matches the User ID against the stored
 * user's email + contact number; only a verified user can get a reset link
 * or a manual reset (both recorded in Recent Configuration Changes).
 */
const PasswordResetPage = () => {
    const { message } = App.useApp();
    const { items: users, update } = useCollection('users');
    const roles = useRoles();
    const logChange = useLogChange();

    const [userId, setUserId] = useState('');
    const [email, setEmail] = useState('');
    const [contact, setContact] = useState('');
    const [verified, setVerified] = useState(null);
    const [error, setError] = useState('');
    const [tempPassword, setTempPassword] = useState(null);

    // Any edit after verifying needs a fresh verification.
    const edit = (setter) => (e) => {
        setter(e.target.value);
        setVerified(null);
        setError('');
    };

    const verify = () => {
        if (!userId.trim()) return setError('Enter the User ID.');
        const user = users.find((u) => u.userId.toLowerCase() === userId.trim().toLowerCase());
        if (!user) return setError(`No user found with User ID "${userId.trim()}".`);
        if (!email.trim() || !contact.trim()) return setError('Enter the registered email address and contact number.');
        if (user.email.toLowerCase() !== email.trim().toLowerCase()) return setError('Email address does not match the registered email.');
        if (normalizePhone(user.contact) !== normalizePhone(contact)) return setError('Contact number does not match the registered number.');
        if (['Suspended', 'Resigned'].includes(user.status)) return setError(`${user.name}'s account is ${user.status}. Activate it in User Activation first.`);
        setError('');
        setVerified(user);
        message.success(`${user.name} verified`);
    };

    const requireVerified = () => {
        if (verified) return true;
        message.warning('Verify the user first.');
        return false;
    };

    const sendLink = () => {
        if (!requireVerified()) return;
        update(verified.id, { lastResetLinkAt: new Date().toISOString() });
        logChange('Password Reset', `Reset link · ${verified.userId}`, '—', `Sent to ${verified.email}`);
        message.success(`Secure reset link sent to ${verified.email}`);
    };

    const resetManually = () => {
        if (!requireVerified()) return;
        const pw = generatePassword();
        update(verified.id, { tempPassword: pw, passwordResetAt: new Date().toISOString() });
        logChange('Password Reset', `Manual reset · ${verified.userId}`, '—', 'Temp password issued');
        setTempPassword(pw);
    };

    const clear = () => {
        setUserId('');
        setEmail('');
        setContact('');
        setVerified(null);
        setTempPassword(null);
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
                        <Button onClick={verify} style={{ height: 34, fontSize: 13, fontWeight: 600, background: COLORS.primarySoft, color: COLORS.primary, border: 'none' }}>Verify User</Button>
                        <Button type="primary" onClick={sendLink} style={{ height: 34, fontSize: 13, fontWeight: 600 }}>Send  Link</Button>
                        <Button onClick={resetManually} style={{ height: 34, fontSize: 13, fontWeight: 600, background: COLORS.primarySoft, color: COLORS.primary, border: 'none' }}>Reset Manually</Button>
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
        </>
    );
};

export default PasswordResetPage;
