// services/scheduledTasks.js
const cron = require('node-cron');
const RecommendationService = require('./recommendationService');
const User = require('../models/User');
const Recommendation = require('../models/Recommendation');

class ScheduledTasks {
    // 启动定时任务
    static initScheduledTasks() {
        // 每天凌晨3点更新所有用户的推荐
        cron.schedule('0 3 * * *', async () => {
            console.log('开始执行每日推荐更新...');
            await this.updateAllUsersRecommendations();
            console.log('每日推荐更新完成');
        });
        
        // 每4小时更新一次热门内容
        cron.schedule('0 */4 * * *', async () => {
            console.log('开始更新热门内容...');
            await this.updateTrendingRecommendations();
            console.log('热门内容更新完成');
        });
        
        // 每周一清理过期推荐
        cron.schedule('0 2 * * 1', async () => {
            console.log('开始清理过期推荐...');
            await this.cleanupExpiredRecommendations();
            console.log('过期推荐清理完成');
        });
    }
    
    // 更新所有用户的推荐
    static async updateAllUsersRecommendations() {
        try {
            // 查询所有活跃用户
            const users = await User.find({ status: 'active' });
            
            console.log(`找到 ${users.length} 个活跃用户需要更新推荐`);
            
            for (const user of users) {
                try {
                    await RecommendationService.updateUserRecommendations(user._id);
                    console.log(`用户 ${user._id} 推荐更新成功`);
                } catch (error) {
                    console.error(`用户 ${user._id} 推荐更新失败:`, error);
                }
                
                // 避免对数据库造成过大压力，每更新10个用户等待1秒
                if (users.indexOf(user) % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        } catch (error) {
            console.error('更新所有用户推荐失败:', error);
        }
    }
    
    // 更新热门内容推荐
    static async updateTrendingRecommendations() {
        try {
            // 查询具有活跃的trending类型推荐的用户
            const userIds = await Recommendation.distinct('userId', { type: 'trending', status: 'active' });
            
            console.log(`找到 ${userIds.length} 个用户需要更新热门推荐`);
            
            for (const userId of userIds) {
                try {
                    // 删除所有旧的trending推荐
                    await Recommendation.deleteMany({
                        userId,
                        type: 'trending'
                    });
                    
                    // 生成新的trending推荐
                    await RecommendationService.generateTrendingRecommendations(userId);
                    
                    console.log(`用户 ${userId} 热门推荐更新成功`);
                } catch (error) {
                    console.error(`用户 ${userId} 热门推荐更新失败:`, error);
                }
                
                // 避免对数据库造成过大压力，每处理10个用户等待1秒
                if (userIds.indexOf(userId) % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        } catch (error) {
            console.error('更新热门推荐失败:', error);
        }
    }
    
    // 清理过期推荐
    static async cleanupExpiredRecommendations() {
        try {
            const result = await Recommendation.deleteMany({
                expiresAt: { $lt: new Date() }
            });
            
            console.log(`已删除 ${result.deletedCount} 条过期推荐`);
        } catch (error) {
            console.error('清理过期推荐失败:', error);
        }
    }
}

module.exports = ScheduledTasks;