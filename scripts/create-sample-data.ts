import { db } from '@/lib/prisma'

async function createSampleData() {
  try {
    // Create sample user
    const author = await db.user.upsert({
      where: { email: 'admin@butcapp.com' },
      update: {},
      create: {
        name: 'ButcApp Team',
        email: 'admin@butcapp.com',
        role: 'ADMIN',
        bio: 'Finansal teknoloji ve kişisel finans yönetimi uzmanları'
      }
    })

    // Create categories
    const categories = await Promise.all([
      db.category.upsert({
        where: { slug: 'kişisel-finans' },
        update: {},
        create: {
          name: 'Kişisel Finans',
          slug: 'kişisel-finans',
          description: 'Kişisel finans yönetimi ve bütçeleme ipuçları'
        }
      }),
      db.category.upsert({
        where: { slug: 'yatirim-stratejileri' },
        update: {},
        create: {
          name: 'Yatırım Stratejileri',
          slug: 'yatirim-stratejileri',
          description: 'Yatırım araçları ve stratejileri hakkında bilgiler'
        }
      }),
      db.category.upsert({
        where: { slug: 'finansal-okuryazarlik' },
        update: {},
        create: {
          name: 'Finansal Okuryazarlık',
          slug: 'finansal-okuryazarlik',
          description: 'Finansal okuryazarlık ve ekonomi eğitimi'
        }
      }),
      db.category.upsert({
        where: { slug: 'teknoloji' },
        update: {},
        create: {
          name: 'Teknoloji',
          slug: 'teknoloji',
          description: 'Finansal teknolojiler ve dijital dönüşüm'
        }
      })
    ])

    // Create tags
    const tags = await Promise.all([
      db.tag.upsert({
        where: { slug: 'butc' },
        update: {},
        create: {
          name: 'Bütçe',
          slug: 'butc',
          color: '#10B981'
        }
      }),
      db.tag.upsert({
        where: { slug: 'birikim' },
        update: {},
        create: {
          name: 'Birikim',
          slug: 'birikim',
          color: '#3B82F6'
        }
      }),
      db.tag.upsert({
        where: { slug: 'yatirim' },
        update: {},
        create: {
          name: 'Yatırım',
          slug: 'yatirim',
          color: '#8B5CF6'
        }
      }),
      db.tag.upsert({
        where: { slug: 'kripto-para' },
        update: {},
        create: {
          name: 'Kripto Para',
          slug: 'kripto-para',
          color: '#F59E0B'
        }
      }),
      db.tag.upsert({
        where: { slug: 'hisse-senedi' },
        update: {},
        create: {
          name: 'Hisse Senedi',
          slug: 'hisse-senedi',
          color: '#EF4444'
        }
      })
    ])

    // Create sample posts
    const posts = [
      {
        title: '2024 Yılında Kişisel Finans Yönetimi İçin 10 Altın Kural',
        excerpt: 'Yeni yılda finansal hedeflerinize ulaşmak için uygulayabileceğiniz etkili kişisel finans yönetimi stratejileri.',
        content: `# 2024 Yılında Kişisel Finans Yönetimi İçin 10 Altın Kural

Finansal sağlığınızı iyileştirmek ve para biriktirmek için 2024 yılında uygulayabileceğiniz 10 etkili kural:

## 1. Detaylı Bütçe Oluşturun
Gelir ve giderlerinizi detaylı bir şekilde takip edin. ButcApp gibi uygulamalar kullanarak harcamalarınızı kategorilere ayırın.

## 2. Acil Durum Fonu Oluşturun
En az 3-6 aylık yaşam masrafınızı karşılayacak bir acil durum fonu oluşturun.

## 3. Borçlarınızı Önceliklendirin
Yüksek faizli borçlarınızı öncelikli olarak ödeyin. Kredi kartı borçlarından kurtulun.

## 4. Otomatik Birikim Başlatın
Maaşınızın %10-15'ini otomatik olarak birikim hesabınıza aktarın.

## 5. Yatırımlara Başlayın
Enflasyonun üzerinde getiri sağlamak için yatırım yapın. Diversifikasyon önemlidir.

## 6. Finansal Hedefler Belirleyin
Kısa, orta ve uzun vadeli finansal hedeflerinizin listesini yapın.

## 7. Finansal Eğitim Alın
Kişisel finans, yatırım ve ekonomi hakkında sürekli öğrenin.

## 8. Sigortalarınızı Gözden Geçirin
Sağlık, hayat ve mal sigortalarınızın yeterliliğini kontrol edin.

## 9. Emeklilik Planı Yapın
Erken yaşlarda emeklilik planlamasına başlayın.

## 10. Düzenli Kontrol Edin
Ayda bir finansal durumunuzu gözden geçirin ve planınızı güncelleyin.

Bu kuralları düzenli olarak uygulayarak 2024 yılında finansal hedeflerinize ulaşabilirsiniz.`,
        featured: true,
        categoryId: categories[0].id,
        tagIds: [tags[0].id, tags[1].id],
        seoTitle: '2024 Kişisel Finans Yönetimi İpuçları',
        seoDescription: '2024 yılında finansal hedeflerinize ulaşmak için 10 etkili kişisel finans yönetimi kuralı.',
        keywords: 'kişisel finans, bütçe, birikim, finansal planlama'
      },
      {
        title: 'Yeni Başlayanlar için Yatırım Rehberi',
        excerpt: 'Yatırıma nereden başlayacağınızı bilmeyenler için kapsamlı bir rehber. Temel kavramlar ve stratejiler.',
        content: `# Yeni Başlayanlar için Yatırım Rehberi

Yatırım dünyasına adım atmak göz korkutucu olabilir, ancak doğru bilgi ve strateji ile başarılı olabilirsiniz.

## Yatırım Nedir?
Yatırım, gelecekteki finansal hedeflerinize ulaşmak için paranızı çalıştırmaktır.

## Temel Yatırım Araçları

### 1. Hisse Senetleri
Şirketlerin ortaklık senetleridir. Şirket kar ettiğinde değer kazanır.

### 2. Tahviller
Devlet veya şirketlerin borçlanma senetleridir. Düşük riskli yatırım aracıdır.

### 3. Fonlar
Çok sayıda yatırımcının parasının toplanıp profesyonel yöneticiler tarafından yönetildiği yatırım araçlarıdır.

### 4. Kripto Paralar
Dijital ve merkeziyetsiz para birimleridir. Yüksek riskli potansiyel yüksek getiri sunar.

## Yatırım Stratejileri

### 1. Diversifikasyon
Yumurtaları aynı sepete koymayın. Farklı yatırım araçlarına dağılın.

### 2. Uzun Vadeli Düşünün
Kısa vadeli dalgalanmalara takılmayın. Uzun vadeli hedefleriniz olsun.

### 3. Düzenli Yatırım
Aylık düzenli olarak yatırım yapın. Zamanlama yerine tutarlılık önemlidir.

### 4. Risk Yönetimi
Yatırım yapmadan önce risk toleransınızı belirleyin.

## Başlangıç Adımları

1. **Finansal Durumunuzu Değerlendirin**: Borçlarınızı kapatın ve acil durum fonu oluşturun.
2. **Yatırım Hedefleri Belirleyin**: Emeklilik, ev alımı, eğitim gibi hedefleriniz olsun.
3. **Yatırım Bilgisi Edinin**: Kitap okuyun, seminerlere katılın.
4. **Küçük Başlayın**: Küçük miktarlarla başlayarak deneyim kazanın.
5. **Danışmanlık Alın**: Gerekirse profesyonel finansal danışmanlardan destek alın.

Unutmayın, yatırım bir maraton, sprint değil. Sabırlı ve disiplinli olun.`,
        featured: false,
        categoryId: categories[1].id,
        tagIds: [tags[2].id, tags[3].id, tags[4].id],
        seoTitle: 'Yeni Başlayanlar İçin Yatırım Rehberi',
        seoDescription: 'Yatırıma yeni başlayanlar için temel bilgiler, yatırım araçları ve stratejiler.',
        keywords: 'yatırım, hisse senedi, kripto para, fon, tahvil'
      },
      {
        title: 'Bütçe Yaparken Yapılan 5 Yaygın Hata',
        excerpt: 'Bütçe yaparken çoğu insanın yaptığı hatalar ve bu hatalardan nasıl kaçınılacağı.',
        content: `# Bütçe Yaparken Yapılan 5 Yaygın Hata

Bütçe yapmak finansal özgürlüğün ilk adımıdır, ancak yanlış yaklaşımlar başarısızlığa neden olabilir.

## 1. Gerçekçi Olmamak
En yaygın hata, bütçenin gerçekçi olmamasıdır. Gelirinizi ve giderlerinizi abartılı bir şekilde tahmin etmek.

**Çözüm**: Son 3 ayın harcamalarınızı analiz ederek gerçekçi bir bütçe oluşturun.

## 2. Esnek Olmamak
Bütçenin katı kurallara bağlanması, sürdürülebilir olmasını engeller.

**Çözüm**: Bütçenize esneklik katın. Beklenmedik harcamalar için pay ayırın.

## 3. Küçük Harcamaları Göz Ardı Etmek
Kahve, atıştırmalık gibi küçük harcamarın birikimini göz ardı etmek.

**Çözüm**: Tüm harcamalarınızı takip edin. Küçük harcamarın büyük etkisini görün.

## 4. Düzenli Kontrol Yapmamak
Bütçeyi oluşturup unutmak, en büyük hatalardan biridir.

**Çözüm**: Haftalık veya aylık olarak bütçenizi gözden geçirin ve güncelleyin.

## 5. Motivasyon Kaybı
Bütçe yapmaya başladıktan sonra motivasyonun kaybolması.

**Çözüm**: Küçük hedefler belirleyin ve başarılarınızı kutlayın. Finansal ilerlemenizi takip edin.

## Başarılı Bütçe İçin İpuçları

- **Otomatik Takip**: ButcApp gibi uygulamalar kullanarak harcamalarınızı otomatik takip edin
- **50/30/20 Kuralı**: Gelirinizin %50'sini ihtiyaçlara, %30'unu isteklere, %20'sini birikime ayırın
- **Hedef Belirleme**: Spesifik finansal hedefleriniz olsun
- **Ödüllendirme**: Bütçe hedeflerinize ulaştığınızda kendinizi ödüllendirin

Bütçe yapmak ceza değil, finansal özgürlüğe giden yoldur. Doğru yaklaşım ile başarılı olabilirsiniz.`,
        featured: false,
        categoryId: categories[0].id,
        tagIds: [tags[0].id],
        seoTitle: 'Bütçe Yaparken Yapılan Yaygın Hatalar',
        seoDescription: 'Bütçe yaparken yapılan 5 yaygın hata ve çözüm önerileri.',
        keywords: 'bütçe, finansal hata, harcama takibi, kişisel finans'
      }
    ]

    // Create posts
    for (const postData of posts) {
      const wordCount = postData.content.split(/\s+/).length
      const readTime = Math.ceil(wordCount / 200)

      const { tagIds, ...postFields } = postData

      await db.post.create({
        data: {
          ...postFields,
          slug: postData.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, ''),
          readTime,
          status: 'PUBLISHED',
          publishedAt: new Date(),
          authorId: author.id,
          tags: {
            connect: tagIds.map((id: string) => ({ id }))
          }
        }
      })
    }

    console.log('Sample data created successfully!')
    console.log(`Created ${categories.length} categories`)
    console.log(`Created ${tags.length} tags`)
    console.log(`Created ${posts.length} posts`)

  } catch (error) {
    console.error('Error creating sample data:', error)
  } finally {
    await db.$disconnect()
  }
}

// Run the function
createSampleData()