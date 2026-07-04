export interface TestEntity {
  id: number;
  data: string;
}

export class TestDataGenerator {
    static generateTestEntities(count: number, startId: number = 0): TestEntity[] {
        const entities: TestEntity[] = [];
        const fillerData = "x".repeat(100);
  
        for (let i = 0; i < count; i++) {
            entities.push({
                id: startId + i,
                data: `Entity_${startId + i}_${fillerData}`,
            });
        }
  
        return entities;
    }
}