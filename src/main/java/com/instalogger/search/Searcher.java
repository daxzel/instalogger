package com.instalogger.search;

import org.apache.lucene.analysis.standard.StandardAnalyzer;
import org.apache.lucene.document.*;
import org.apache.lucene.index.*;
import org.apache.lucene.queryparser.classic.ParseException;
import org.apache.lucene.queryparser.classic.QueryParser;
import org.apache.lucene.search.*;
import org.apache.lucene.store.Directory;
import org.apache.lucene.store.RAMDirectory;
import org.apache.lucene.util.Version;
import org.vertx.java.core.Handler;
import org.vertx.java.core.eventbus.EventBus;
import org.vertx.java.core.eventbus.Message;
import org.vertx.java.core.json.JsonObject;

import java.util.ArrayList;
import java.util.List;


/**
 * Created with IntelliJ IDEA.
 * User: andreytsarevskiy
 * Date: 30/11/13
 * Time: 11:12
 * To change this template use File | Settings | File Templates.
 */
public class Searcher {

    public static final FieldType TYPE_STORED_NOT_INDEXED = new FieldType();

    static {
        TYPE_STORED_NOT_INDEXED.setIndexed(false);
        TYPE_STORED_NOT_INDEXED.setOmitNorms(true);
        TYPE_STORED_NOT_INDEXED.setStored(true);
        TYPE_STORED_NOT_INDEXED.setTokenized(false);
        TYPE_STORED_NOT_INDEXED.freeze();
    }

    protected Directory index;
    protected StandardAnalyzer analyzer;
    protected IndexWriterConfig config;
    protected IndexWriter writer;

    public Searcher(EventBus eventBus) {
        analyzer = new StandardAnalyzer(Version.LUCENE_46);
        index = new RAMDirectory();

        try {
            config = new IndexWriterConfig(Version.LUCENE_46, analyzer);
            writer = new IndexWriter(index, config);
            writer.commit();
        } catch (Exception ex) {
            ex.printStackTrace();
        }

        eventBus.registerHandler("messageAdded", new Handler<Message>() {
            @Override
            public void handle(Message message) {
                JsonObject jsonMessage = (JsonObject) message.body();
                try {
                    Document doc = new Document();
                    doc.add(new TextField("text", jsonMessage.getString("text"), Field.Store.NO));
                    doc.add(new LongField("serverId", jsonMessage.getNumber("server_id").intValue(), Field.Store.YES));
                    doc.add(new LongField("id", jsonMessage.getNumber("id").intValue(), Field.Store.YES));
                    writer.addDocument(doc);
                    writer.commit();
                } catch (Exception ex) {
                    ex.printStackTrace();
                }
            }
        });
    }

    public List<Integer> getResult(String search, Integer serverId) throws Exception {
        IndexReader reader = DirectoryReader.open(index);
        IndexSearcher searcher = new IndexSearcher(reader);

//        Query query = new QueryParser(Version.LUCENE_46, "text", analyzer).parse(search);

        BooleanQuery booleanQuery = new BooleanQuery();
        Query query1 = new TermQuery(new Term("serverId", serverId.toString()));
        Query query2 = new PrefixQuery(new Term("text", search));
        booleanQuery.add(query1, BooleanClause.Occur.SHOULD);
        booleanQuery.add(query2, BooleanClause.Occur.SHOULD);

        TopScoreDocCollector collector = TopScoreDocCollector.create(10000, true);
        searcher.search(booleanQuery, collector);
        ScoreDoc[] hits = collector.topDocs().scoreDocs;

        List<Integer> list = new ArrayList<>();
        if (hits.length > 0) {
            for (int i = 0; i < hits.length -1 ; i++) {
                Document doc = searcher.doc(hits[i].doc);
                list.add(Integer.valueOf(doc.get("id")));
            }
        }
        return list;
    }
}
