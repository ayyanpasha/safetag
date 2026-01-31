import { describe, it, expect } from 'vitest';
import {
  PhoneSchema,
  VehicleNumberSchema,
  LocationSchema,
  OtpSendSchema,
  OtpVerifySchema,
  CreateVehicleSchema,
  PlanType,
  SubStatus,
  UserRole,
  ScanAction,
  EmergencyType,
  ProblemType,
  PLAN_DETAILS,
  QR_SHORT_CODE_PREFIX,
  EVENTS,
} from '../index.js';

describe('PhoneSchema', () => {
  it('accepts valid Indian phone numbers', () => {
    expect(PhoneSchema.parse('+919876543210')).toBe('+919876543210');
    expect(PhoneSchema.parse('+916000000000')).toBe('+916000000000');
  });

  it('rejects invalid phone numbers', () => {
    expect(() => PhoneSchema.parse('+911234567890')).toThrow(); // starts with 1
    expect(() => PhoneSchema.parse('9876543210')).toThrow(); // no +91
    expect(() => PhoneSchema.parse('+9198765432')).toThrow(); // too short
    expect(() => PhoneSchema.parse('+9198765432101')).toThrow(); // too long
    expect(() => PhoneSchema.parse('')).toThrow();
  });
});

describe('VehicleNumberSchema', () => {
  it('accepts valid vehicle numbers', () => {
    expect(VehicleNumberSchema.parse('KA01AB1234')).toBe('KA01AB1234');
    expect(VehicleNumberSchema.parse('MH12DE5678')).toBe('MH12DE5678');
    expect(VehicleNumberSchema.parse('ABCD')).toBe('ABCD');
  });

  it('rejects invalid vehicle numbers', () => {
    expect(() => VehicleNumberSchema.parse('abc')).toThrow(); // lowercase
    expect(() => VehicleNumberSchema.parse('AB CD')).toThrow(); // spaces
    expect(() => VehicleNumberSchema.parse('AB')).toThrow(); // too short
    expect(() => VehicleNumberSchema.parse('A'.repeat(16))).toThrow(); // too long
  });
});

describe('LocationSchema', () => {
  it('accepts valid coordinates', () => {
    const result = LocationSchema.parse({ latitude: 12.9716, longitude: 77.5946 });
    expect(result.latitude).toBe(12.9716);
    expect(result.longitude).toBe(77.5946);
  });

  it('accepts boundary values', () => {
    expect(LocationSchema.parse({ latitude: -90, longitude: -180 })).toBeTruthy();
    expect(LocationSchema.parse({ latitude: 90, longitude: 180 })).toBeTruthy();
  });

  it('rejects out of range', () => {
    expect(() => LocationSchema.parse({ latitude: 91, longitude: 0 })).toThrow();
    expect(() => LocationSchema.parse({ latitude: 0, longitude: 181 })).toThrow();
  });
});

describe('OtpSendSchema', () => {
  it('validates phone field', () => {
    expect(OtpSendSchema.parse({ phone: '+919876543210' })).toEqual({ phone: '+919876543210' });
  });

  it('rejects missing phone', () => {
    expect(() => OtpSendSchema.parse({})).toThrow();
  });
});

describe('OtpVerifySchema', () => {
  it('validates phone and 6-digit OTP', () => {
    const result = OtpVerifySchema.parse({ phone: '+919876543210', otp: '123456' });
    expect(result.otp).toBe('123456');
  });

  it('rejects wrong OTP length', () => {
    expect(() => OtpVerifySchema.parse({ phone: '+919876543210', otp: '12345' })).toThrow();
    expect(() => OtpVerifySchema.parse({ phone: '+919876543210', otp: '1234567' })).toThrow();
  });
});

describe('CreateVehicleSchema', () => {
  it('accepts valid vehicle data', () => {
    const result = CreateVehicleSchema.parse({
      vehicleNumber: 'KA01AB1234',
      make: 'Toyota',
      model: 'Camry',
      color: 'White',
    });
    expect(result.vehicleNumber).toBe('KA01AB1234');
  });

  it('make/model/color are optional', () => {
    const result = CreateVehicleSchema.parse({ vehicleNumber: 'KA01AB1234' });
    expect(result.make).toBeUndefined();
  });
});

describe('Enums', () => {
  it('PlanType has correct values', () => {
    expect(PlanType.options).toEqual(['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'YEARLY']);
  });

  it('SubStatus has correct values', () => {
    expect(SubStatus.options).toEqual(['ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING']);
  });

  it('UserRole has correct values', () => {
    expect(UserRole.options).toEqual(['OWNER', 'DEALER', 'ADMIN']);
  });

  it('ScanAction has correct values', () => {
    expect(ScanAction.options).toEqual(['VIEW', 'WHATSAPP', 'VOIP_CALL', 'EMERGENCY']);
  });

  it('EmergencyType has correct values', () => {
    expect(EmergencyType.options).toContain('ACCIDENT');
    expect(EmergencyType.options).toContain('THEFT');
    expect(EmergencyType.options).toContain('FIRE');
  });

  it('ProblemType has correct values', () => {
    expect(ProblemType.options).toContain('WRONG_PARKING');
    expect(ProblemType.options).toContain('LIGHTS_ON');
  });
});

describe('PLAN_DETAILS', () => {
  it('MONTHLY plan: ₹299, 3 vehicles', () => {
    expect(PLAN_DETAILS.MONTHLY).toEqual({ price: 299, duration: 1, vehicleLimit: 3 });
  });

  it('QUARTERLY plan: ₹499, 5 vehicles', () => {
    expect(PLAN_DETAILS.QUARTERLY).toEqual({ price: 499, duration: 3, vehicleLimit: 5 });
  });

  it('SEMI_ANNUAL plan: ₹699, 7 vehicles', () => {
    expect(PLAN_DETAILS.SEMI_ANNUAL).toEqual({ price: 699, duration: 6, vehicleLimit: 7 });
  });

  it('YEARLY plan: ₹999, 10 vehicles', () => {
    expect(PLAN_DETAILS.YEARLY).toEqual({ price: 999, duration: 12, vehicleLimit: 10 });
  });
});

describe('Constants', () => {
  it('QR_SHORT_CODE_PREFIX is ST-', () => {
    expect(QR_SHORT_CODE_PREFIX).toBe('ST-');
  });

  it('EVENTS contains expected event names', () => {
    expect(EVENTS.USER_CREATED).toBe('user.created');
    expect(EVENTS.SUBSCRIPTION_ACTIVATED).toBe('subscription.activated');
    expect(EVENTS.SCAN_VERIFIED).toBe('scan.verified');
    expect(EVENTS.EMERGENCY_CREATED).toBe('emergency.created');
  });
});
