import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn().mockResolvedValue({
      listen: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));

describe('Main', () => {
  it('should bootstrap the application', async () => {
    const spyCreate = jest.spyOn(NestFactory, 'create');
    const spyListen = jest.spyOn((await NestFactory.create(AppModule)), 'listen');

    await import('./main');

    expect(spyCreate).toHaveBeenCalledWith(AppModule);
    expect(spyListen).toHaveBeenCalledWith(3000);
  });
});
