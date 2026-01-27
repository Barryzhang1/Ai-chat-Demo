import { Logger } from '@nestjs/common';

/**
 * MongoDB查询日志工具类
 * 用于统一格式化和打印MongoDB查询语句
 */
export class MongoLogger {
  private static logger = new Logger('MongoQuery');

  /**
   * 记录MongoDB查询
   * @param collection 集合名称
   * @param query 查询条件
   * @param options 查询选项（limit, sort, skip等）
   * @param description 查询描述（可选）
   */
  static logQuery(
    collection: string,
    query: Record<string, any>,
    options?: {
      limit?: number;
      sort?: Record<string, 1 | -1>;
      skip?: number;
      projection?: Record<string, 0 | 1>;
    },
    description?: string,
  ): void {
    const parts: string[] = [];

    // 基础查询
    parts.push(`db.${collection}.find(${JSON.stringify(query)})`);

    // projection
    if (options?.projection) {
      parts.push(`.projection(${JSON.stringify(options.projection)})`);
    }

    // sort
    if (options?.sort) {
      parts.push(`.sort(${JSON.stringify(options.sort)})`);
    }

    // skip
    if (options?.skip) {
      parts.push(`.skip(${options.skip})`);
    }

    // limit
    if (options?.limit) {
      parts.push(`.limit(${options.limit})`);
    }

    const queryString = parts.join('');
    const prefix = description ? `🔍 [${description}] ` : '🔍 ';

    this.logger.log(prefix + queryString);
  }

  /**
   * 记录查询结果
   * @param count 结果数量
   * @param duration 查询耗时（毫秒）
   * @param samples 示例数据（可选）
   */
  static logResult(count: number, duration: number, samples?: string[]): void {
    let message = `✅ Result: ${count} documents (${duration}ms)`;

    if (count > 0 && samples && samples.length > 0) {
      message += ` - ${samples.slice(0, 3).join(', ')}${samples.length > 3 ? '...' : ''}`;
    } else if (count === 0) {
      message += ' ⚠️ No data found!';
    }

    this.logger.log(message);
  }

  /**
   * 记录更新操作
   * @param collection 集合名称
   * @param filter 过滤条件
   * @param update 更新内容
   * @param description 操作描述（可选）
   */
  static logUpdate(
    collection: string,
    filter: Record<string, any>,
    update: Record<string, any>,
    description?: string,
  ): void {
    const prefix = description ? `📝 [${description}] ` : '📝 ';
    const queryString = `db.${collection}.updateOne(${JSON.stringify(filter)}, ${JSON.stringify(update)})`;
    this.logger.log(prefix + queryString);
  }

  /**
   * 记录插入操作
   * @param collection 集合名称
   * @param document 插入的文档
   * @param description 操作描述（可选）
   */
  static logInsert(
    collection: string,
    document: Record<string, any>,
    description?: string,
  ): void {
    const prefix = description ? `➕ [${description}] ` : '➕ ';
    const queryString = `db.${collection}.insertOne(${JSON.stringify(document)})`;
    this.logger.log(prefix + queryString);
  }

  /**
   * 记录删除操作
   * @param collection 集合名称
   * @param filter 过滤条件
   * @param description 操作描述（可选）
   */
  static logDelete(
    collection: string,
    filter: Record<string, any>,
    description?: string,
  ): void {
    const prefix = description ? `🗑️  [${description}] ` : '🗑️  ';
    const queryString = `db.${collection}.deleteOne(${JSON.stringify(filter)})`;
    this.logger.log(prefix + queryString);
  }

  /**
   * 记录聚合操作
   * @param collection 集合名称
   * @param pipeline 聚合管道
   * @param description 操作描述（可选）
   */
  static logAggregate(
    collection: string,
    pipeline: any[],
    description?: string,
  ): void {
    const prefix = description ? `🔄 [${description}] ` : '🔄 ';
    const queryString = `db.${collection}.aggregate(${JSON.stringify(pipeline, null, 2)})`;
    this.logger.log(prefix + queryString);
  }
}
