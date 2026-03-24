import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { HttpClientService } from '../../../src/client/http/http-client.service';

describe('HttpClientService', () => {
  let service: HttpClientService;
  let httpService: HttpService;

  beforeEach(async () => {
    const mockHttpService = {
      post: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HttpClientService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<HttpClientService>(HttpClientService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should post data and extract the generic payload from the HTTP response', async () => {
    const payload = {
      originalname: 'test.pdf',
    } as Express.Multer.File;

    const httpResponse: AxiosResponse = {
      data: { result: 'success' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { headers: undefined },
    };

    (httpService.post as jest.Mock).mockReturnValue(of(httpResponse));

    const result = await service.dispatch('http://etl-service/api', payload);

    expect(httpService.post).toHaveBeenCalledWith(
      'http://etl-service/api',
      payload,
    );
    expect(result).toEqual({ result: 'success' });
  });
});
